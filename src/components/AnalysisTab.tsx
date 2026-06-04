/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { StressTestReport, HorizonProjection, HorizonMetrics, MetricUncertainty, GeographicScaleContext } from '../types';
import { MetricGroup } from './MetricGroup';

interface AnalysisTabProps {
  activeReport: StressTestReport;
  currentProjection: HorizonProjection;
  onSelectHorizon: (horizon: number) => void;
}

type ViewMode = 'domain' | 'confidence';

const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const;

/**
 * Type guard to validate MetricUncertainty objects
 * Ensures the object has all required properties before use
 */
function isMetricUncertainty(value: unknown): value is MetricUncertainty {
  return (
    typeof value === 'object' &&
    value !== null &&
    'confidenceLevel' in value &&
    'lowScenario' in value &&
    'baselineScenario' in value &&
    'highScenario' in value &&
    'failureChainNarrative' in value &&
    'provenance' in value
  );
}

const METRIC_GROUPS = [
  {
    name: 'ENVIRONMENTAL METRICS',
    metrics: [
      { name: 'Flood Probability', key: 'floodProb' as const, uncertaintyKey: 'floodProbUncertainty' as const },
      { name: 'Wet-Bulb Temperature', key: 'wetBulbTemp' as const, uncertaintyKey: 'wetBulbTempUncertainty' as const },
      { name: 'Heat Index Days', key: 'heatIndexDays' as const, uncertaintyKey: 'heatIndexDaysUncertainty' as const },
      { name: 'Average Temperature', key: 'averageTemp' as const, uncertaintyKey: 'averageTempUncertainty' as const },
      { name: 'Hardiness Zone', key: 'hardinessZone' as const, uncertaintyKey: 'hardinessZoneUncertainty' as const },
      { name: 'Local Aquifer', key: 'localAquifer' as const, uncertaintyKey: 'localAquiferUncertainty' as const },
      { name: 'Freshwater Status', key: 'freshwaterStatus' as const, uncertaintyKey: 'freshwaterStatusUncertainty' as const },
    ],
  },
  {
    name: 'ECONOMIC METRICS',
    metrics: [
      { name: 'Cap Rate', key: 'capRate' as const, uncertaintyKey: 'capRateUncertainty' as const },
      { name: 'Municipal Debt', key: 'municipalDebt' as const, uncertaintyKey: 'municipalDebtUncertainty' as const },
    ],
  },
  {
    name: 'STRUCTURAL METRICS',
    metrics: [
      { name: 'Foundation Integrity', key: 'foundationIntegrity' as const, uncertaintyKey: 'foundationIntegrityUncertainty' as const },
    ],
  },
];

// Convert GeographicScaleContext into HorizonMetrics-like structure for MetricGroup
// Flattens nested GeographicSignal objects: { name, value, uncertainty } → { key: value, keyUncertainty: uncertainty }
function buildGeographicMetrics(context: GeographicScaleContext): any {
  const flatMetrics: any = {};

  // Flatten each signal category: extract value and uncertainty separately
  Object.entries(context.economicViability).forEach(([key, signal]) => {
    flatMetrics[key] = signal.value;
    flatMetrics[key + 'Uncertainty'] = signal.uncertainty;
  });

  Object.entries(context.infrastructureResilience).forEach(([key, signal]) => {
    flatMetrics[key] = signal.value;
    flatMetrics[key + 'Uncertainty'] = signal.uncertainty;
  });

  Object.entries(context.demographicTrends).forEach(([key, signal]) => {
    flatMetrics[key] = signal.value;
    flatMetrics[key + 'Uncertainty'] = signal.uncertainty;
  });

  return flatMetrics;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  activeReport,
  currentProjection,
  onSelectHorizon,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('domain');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-border-dark pb-4">
        <h2 className="font-mono text-lg font-bold text-accent-gold uppercase tracking-wider mb-4">
          Uncertainty & Failure Analysis
        </h2>

        {/* Horizon selector */}
        <div className="flex gap-2 flex-wrap mb-4">
          {activeReport.projections.map((proj) => (
            <button
              key={proj.horizon}
              onClick={() => onSelectHorizon(proj.horizon)}
              className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
                proj.horizon === currentProjection.horizon
                  ? 'bg-accent-gold text-black font-bold'
                  : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
              }`}
            >
              {proj.horizon}Y
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('domain')}
            className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
              viewMode === 'domain'
                ? 'bg-accent-gold text-black font-bold'
                : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
            }`}
          >
            View by Domain
          </button>
          <button
            onClick={() => setViewMode('confidence')}
            className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
              viewMode === 'confidence'
                ? 'bg-accent-gold text-black font-bold'
                : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
            }`}
          >
            View by Confidence
          </button>
        </div>

        {/* Legend */}
        <div className="mt-3 text-xs text-[#999] flex gap-4">
          <span>🟢 HIGH - Authoritative source</span>
          <span>🟡 MEDIUM - Mixed data</span>
          <span>🔴 LOW - Estimated</span>
        </div>
      </div>

      {/* Metrics content */}
      <div>
        {viewMode === 'domain' && (
          <div>
            {METRIC_GROUPS.map((group) => (
              <MetricGroup
                key={group.name}
                groupName={group.name}
                metrics={group.metrics}
                horizonMetrics={currentProjection.metrics}
              />
            ))}
          </div>
        )}

        {viewMode === 'confidence' && (
          <div>
            {CONFIDENCE_LEVELS.map((confidenceLevel) => {
              const metricsWithConfidence = METRIC_GROUPS.flatMap((group) =>
                group.metrics.filter((metric) => {
                  const uncertainty = currentProjection.metrics[metric.uncertaintyKey];
                  return uncertainty && isMetricUncertainty(uncertainty) && uncertainty.confidenceLevel === confidenceLevel;
                })
              );

              if (metricsWithConfidence.length === 0) return null;

              return (
                <MetricGroup
                  key={confidenceLevel}
                  groupName={`${confidenceLevel} CONFIDENCE METRICS`}
                  metrics={metricsWithConfidence}
                  horizonMetrics={currentProjection.metrics}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* NEIGHBORHOOD CONTEXT */}
      {currentProjection.geographicContext && (
        <div className="mt-8 border-t border-border-dark pt-6">
          <h3 className="font-mono text-lg font-bold text-accent-gold uppercase tracking-wider mb-4">
            Neighborhood Context ({currentProjection.geographicContext.neighborhood.location})
          </h3>

          <div>
            {viewMode === 'domain' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />
              </div>
            )}

            {viewMode === 'confidence' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.neighborhood)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CITY CONTEXT */}
      {currentProjection.geographicContext && (
        <div className="mt-8 border-t border-border-dark pt-6">
          <h3 className="font-mono text-lg font-bold text-accent-gold uppercase tracking-wider mb-4">
            City Context ({currentProjection.geographicContext.city.location})
          </h3>

          <div>
            {viewMode === 'domain' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />
              </div>
            )}

            {viewMode === 'confidence' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.city)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGION CONTEXT */}
      {currentProjection.geographicContext && (
        <div className="mt-8 border-t border-border-dark pt-6">
          <h3 className="font-mono text-lg font-bold text-accent-gold uppercase tracking-wider mb-4">
            Region Context ({currentProjection.geographicContext.region.location})
          </h3>

          <div>
            {viewMode === 'domain' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />
              </div>
            )}

            {viewMode === 'confidence' && (
              <div>
                <MetricGroup
                  groupName="ECONOMIC VIABILITY"
                  metrics={[
                    { name: 'Municipal Debt Ratio', key: 'municipalDebtRatio' as const, uncertaintyKey: 'municipalDebtRatio' as const },
                    { name: 'Tax Collection Rate', key: 'taxCollectionRate' as const, uncertaintyKey: 'taxCollectionRate' as const },
                    { name: 'Commercial Vacancy Rate', key: 'commercialVacancyRate' as const, uncertaintyKey: 'commercialVacancyRate' as const },
                    { name: 'Business Formation Rate', key: 'businessFormationRate' as const, uncertaintyKey: 'businessFormationRate' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="INFRASTRUCTURE RESILIENCE"
                  metrics={[
                    { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAge' as const },
                    { name: 'Electrical Grid Stress', key: 'electricalGridStress' as const, uncertaintyKey: 'electricalGridStress' as const },
                    { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailability' as const },
                    { name: 'Road Maintenance Backlog', key: 'roadMaintenanceBacklog' as const, uncertaintyKey: 'roadMaintenanceBacklog' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="DEMOGRAPHIC TRENDS"
                  metrics={[
                    { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRate' as const },
                    { name: 'Population Growth', key: 'populationGrowth' as const, uncertaintyKey: 'populationGrowth' as const },
                    { name: 'Age Distribution Shift', key: 'ageDistributionShift' as const, uncertaintyKey: 'ageDistributionShift' as const },
                    { name: 'Education Level Change', key: 'educationLevelChange' as const, uncertaintyKey: 'educationLevelChange' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="CLIMATE MIGRATION"
                  metrics={[
                    { name: 'Climate Refugee Inflow', key: 'climateRefugeeInflowProjection' as const, uncertaintyKey: 'climateRefugeeInflowProjection' as const },
                    { name: 'Climate Refugee Outflow', key: 'climateRefugeeOutflowProjection' as const, uncertaintyKey: 'climateRefugeeOutflowProjection' as const },
                    { name: 'Temperature Exposure', key: 'temperatureExposure' as const, uncertaintyKey: 'temperatureExposure' as const },
                    { name: 'Flood Exposure (Origins)', key: 'floodExposureOfOriginRegions' as const, uncertaintyKey: 'floodExposureOfOriginRegions' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />

                <MetricGroup
                  groupName="SOCIAL FABRIC"
                  metrics={[
                    { name: 'Civic Participation', key: 'civicParticipationRate' as const, uncertaintyKey: 'civicParticipationRate' as const },
                    { name: 'Community Stability', key: 'communityStabilityIndex' as const, uncertaintyKey: 'communityStabilityIndex' as const },
                    { name: 'Political Alignment', key: 'politicalAlignmentWithAdaptation' as const, uncertaintyKey: 'politicalAlignmentWithAdaptation' as const },
                    { name: 'Resilience Sentiment', key: 'resilienceNewsSentiment' as const, uncertaintyKey: 'resilienceNewsSentiment' as const },
                  ]}
                  horizonMetrics={buildGeographicMetrics(currentProjection.geographicContext.region)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
