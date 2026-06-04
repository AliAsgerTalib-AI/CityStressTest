/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MetricRow } from './MetricRow';
import { HorizonMetrics } from '../types';

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

            // Skip if uncertainty data is missing (shouldn't happen, but defensive)
            if (!uncertainty || typeof uncertainty !== 'object') {
              return null;
            }

            return (
              <MetricRow
                key={metric.key}
                metricName={metric.name}
                metricValue={String(value)}
                uncertainty={uncertainty as any}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
