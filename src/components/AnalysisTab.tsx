/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { StressTestReport, HorizonProjection, HorizonMetrics } from '../types';
import { MetricGroup } from './MetricGroup';

interface AnalysisTabProps {
  activeReport: StressTestReport;
  currentProjection: HorizonProjection;
  onSelectHorizon: (horizon: number) => void;
}

type ViewMode = 'domain' | 'confidence';

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
            {['HIGH', 'MEDIUM', 'LOW'].map((confidenceLevel) => {
              const metricsWithConfidence = METRIC_GROUPS.flatMap((group) =>
                group.metrics.filter((metric) => {
                  const uncertainty = currentProjection.metrics[metric.uncertaintyKey];
                  return uncertainty && (uncertainty as any).confidenceLevel === confidenceLevel;
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
    </div>
  );
};
