/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MetricRow } from './MetricRow';
import { HorizonMetrics, MetricUncertainty } from '../types';

interface Metric {
  name: string;
  key: keyof HorizonMetrics;
  uncertaintyKey: keyof HorizonMetrics;
}

interface MetricGroupProps {
  groupName: string;
  metrics: Metric[];
  horizonMetrics: HorizonMetrics;
}

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

export const MetricGroup: React.FC<MetricGroupProps> = ({
  groupName,
  metrics,
  horizonMetrics,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border-dark rounded p-4 bg-surface-dark mb-4">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between cursor-pointer hover:bg-surface-light/5 p-2 -m-2"
      >
        <h3 className="font-mono text-sm font-bold text-accent-gold uppercase tracking-wider">
          {expanded ? '▼' : '▶'} {groupName} <span className="text-[#999] font-normal">({metrics.length} metrics)</span>
        </h3>
      </button>

      {/* Metrics list */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {metrics.map((metric) => {
            const value = horizonMetrics[metric.key];
            const uncertainty = horizonMetrics[metric.uncertaintyKey];

            // Validate metric value exists
            if (value === undefined || value === null) {
              console.warn(`Missing metric value for key: ${metric.key}`);
              return null;
            }

            // Validate uncertainty data with type guard
            if (!isMetricUncertainty(uncertainty)) {
              console.warn(`Invalid uncertainty data for key: ${metric.uncertaintyKey}`);
              return null;
            }

            return (
              <MetricRow
                key={metric.key}
                metricName={metric.name}
                metricValue={String(value)}
                uncertainty={uncertainty}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
