/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { StressTestReport, HorizonProjection, HorizonMetrics, MetricUncertainty, GeographicScaleContext } from '../types';
import { MetricGroup } from './MetricGroup';
import { useGeographicCache } from '../hooks/useGeographicCache';

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
function buildGeographicMetrics(context: any): any {
  const metrics: Record<string, string> = {};
  const uncertainties: Record<string, any> = {};

  // Only build metrics for non-empty signals
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && key !== 'scale' && key !== 'location') {
      Object.entries(value).forEach(([signalKey, signal]: [string, any]) => {
        if (signal?.value) {
          metrics[signalKey] = signal.value;
          uncertainties[`${signalKey}Uncertainty`] = signal.uncertainty;
        }
      });
    }
  });

  return { ...metrics, ...uncertainties };
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  activeReport,
  currentProjection,
  onSelectHorizon,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('domain');

  // Extract city and state from location string
  const extractCityState = (location: string) => {
    const parts = location.split(',').map(p => p.trim());
    return {
      city: parts[0] || '',
      state: parts[1] || '',
    };
  };

  const { city, state } = extractCityState(activeReport.location);
  const { data: geographicData, loading: geoLoading, error: geoError } = useGeographicCache(city, state);

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


      {/* CITY CONTEXT */}
      {geographicData?.city && (
        <div className="space-y-4 mt-8 border-t border-border-dark pt-6">
          <h3 className="text-sm font-bold text-accent-gold">📍 CITY: {geographicData.city.location}</h3>

          {geoError && (
            <div className="text-xs text-red-400">❌ {geoError}</div>
          )}

          {geographicData.city.economicViability && Object.values(geographicData.city.economicViability).some((s: any) => s.value) && (
            <MetricGroup
              groupName="ECONOMIC VIABILITY (Real Census data)"
              metrics={[
                { name: 'Median Household Income', key: 'medianHouseholdIncome' as const, uncertaintyKey: 'medianHouseholdIncomeUncertainty' as const },
                { name: 'Poverty Rate', key: 'povertyRate' as const, uncertaintyKey: 'povertyRateUncertainty' as const },
                { name: 'Unemployment Rate', key: 'unemploymentRate' as const, uncertaintyKey: 'unemploymentRateUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.city)}
            />
          )}

          {geographicData.city.demographicTrends && Object.values(geographicData.city.demographicTrends).some((s: any) => s.value) && (
            <MetricGroup
              groupName="DEMOGRAPHIC TRENDS (Real Census data)"
              metrics={[
                { name: 'Population', key: 'population' as const, uncertaintyKey: 'populationUncertainty' as const },
                { name: 'Age Distribution', key: 'ageDistribution' as const, uncertaintyKey: 'ageDistributionUncertainty' as const },
                { name: 'Education Level', key: 'educationLevel' as const, uncertaintyKey: 'educationLevelUncertainty' as const },
                { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRateUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.city)}
            />
          )}

          {geographicData.city.infrastructureResilience && Object.values(geographicData.city.infrastructureResilience).some((s: any) => s.value) ? (
            <MetricGroup
              groupName="INFRASTRUCTURE RESILIENCE (Real data)"
              metrics={[
                { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailabilityUncertainty' as const },
                { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAgeUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.city)}
            />
          ) : (
            <div className="text-xs text-gray-400">⚠ Infrastructure Resilience: Data unavailable for this location</div>
          )}
        </div>
      )}

      {/* REGION CONTEXT */}
      {geographicData?.region && (
        <div className="space-y-4 mt-8 border-t border-border-dark pt-6">
          <h3 className="text-sm font-bold text-accent-gold">📍 REGION: {geographicData.region.location}</h3>

          {geoError && (
            <div className="text-xs text-red-400">❌ {geoError}</div>
          )}

          {geographicData.region.economicViability && Object.values(geographicData.region.economicViability).some((s: any) => s.value) && (
            <MetricGroup
              groupName="ECONOMIC VIABILITY (Real Census data)"
              metrics={[
                { name: 'Median Household Income', key: 'medianHouseholdIncome' as const, uncertaintyKey: 'medianHouseholdIncomeUncertainty' as const },
                { name: 'Poverty Rate', key: 'povertyRate' as const, uncertaintyKey: 'povertyRateUncertainty' as const },
                { name: 'Unemployment Rate', key: 'unemploymentRate' as const, uncertaintyKey: 'unemploymentRateUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.region)}
            />
          )}

          {geographicData.region.demographicTrends && Object.values(geographicData.region.demographicTrends).some((s: any) => s.value) && (
            <MetricGroup
              groupName="DEMOGRAPHIC TRENDS (Real Census data)"
              metrics={[
                { name: 'Population', key: 'population' as const, uncertaintyKey: 'populationUncertainty' as const },
                { name: 'Age Distribution', key: 'ageDistribution' as const, uncertaintyKey: 'ageDistributionUncertainty' as const },
                { name: 'Education Level', key: 'educationLevel' as const, uncertaintyKey: 'educationLevelUncertainty' as const },
                { name: 'Net Migration Rate', key: 'netMigrationRate' as const, uncertaintyKey: 'netMigrationRateUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.region)}
            />
          )}

          {geographicData.region.infrastructureResilience && Object.values(geographicData.region.infrastructureResilience).some((s: any) => s.value) ? (
            <MetricGroup
              groupName="INFRASTRUCTURE RESILIENCE (Real data)"
              metrics={[
                { name: 'Broadband Availability', key: 'broadbandAvailability' as const, uncertaintyKey: 'broadbandAvailabilityUncertainty' as const },
                { name: 'Utility System Age', key: 'utilitySystemAge' as const, uncertaintyKey: 'utilitySystemAgeUncertainty' as const },
              ]}
              horizonMetrics={buildGeographicMetrics(geographicData.region)}
            />
          ) : (
            <div className="text-xs text-gray-400">⚠ Infrastructure Resilience: Data unavailable for this location</div>
          )}
        </div>
      )}
    </div>
  );
};
