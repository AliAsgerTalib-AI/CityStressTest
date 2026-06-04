/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MetricUncertainty } from '../types';

interface MetricRowProps {
  metricName: string;
  metricValue: string;
  uncertainty: MetricUncertainty;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  metricName,
  metricValue,
  uncertainty,
}) => {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor = {
    HIGH: 'bg-green-900 text-green-100',
    MEDIUM: 'bg-yellow-900 text-yellow-100',
    LOW: 'bg-red-900 text-red-100',
  }[uncertainty.confidenceLevel];

  const confidenceEmoji = {
    HIGH: '🟢',
    MEDIUM: '🟡',
    LOW: '🔴',
  }[uncertainty.confidenceLevel];

  return (
    <div className="border-l-2 border-border-dark pl-4 py-3">
      {/* Metric header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-mono text-sm text-[#e5e5e5]">
            {metricName}: <span className="font-bold text-accent-gold">{metricValue}</span>
          </div>
        </div>
      </div>

      {/* Confidence badge + metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <span className={`px-2 py-1 rounded ${confidenceColor} font-mono`}>
          {confidenceEmoji} {uncertainty.confidenceLevel}
        </span>

        <span className="text-[#999]">
          Range: <span className="text-[#ccc]">{uncertainty.lowScenario}</span>
          {' → '}
          <span className="text-accent-gold">{uncertainty.baselineScenario}</span>
          {' → '}
          <span className="text-[#ccc]">{uncertainty.highScenario}</span>
        </span>
      </div>

      {/* Provenance */}
      <div className="mt-2 text-xs text-[#999]">
        <span className="text-[#ccc]">Source:</span> {uncertainty.provenance.source}
        {uncertainty.provenance.verificationDate && ` (${uncertainty.provenance.verificationDate})`}
        {uncertainty.provenance.uncertainty !== 'Unknown' && ` ±${uncertainty.provenance.uncertainty}`}
        {uncertainty.provenance.verified && ' ✓'}
      </div>

      {/* Expandable narrative */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs font-mono text-accent-gold hover:text-accent-gold/80 cursor-pointer flex items-center gap-1"
      >
        <span>{expanded ? '▼' : '▶'}</span> Why this changes
      </button>

      {expanded && (
        <div className="mt-2 text-xs text-[#ccc] leading-relaxed bg-surface-dark p-2 rounded border border-border-dark">
          {uncertainty.failureChainNarrative}
        </div>
      )}
    </div>
  );
};
