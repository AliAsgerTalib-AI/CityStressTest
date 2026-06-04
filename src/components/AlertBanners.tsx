/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BadgeAlert, Sparkles } from 'lucide-react';
import { StressTestReport } from '../types';

interface AlertBannersProps {
  dataSource: 'AI_GENERATED' | 'PROCEDURAL_SIMULATION' | 'PRESET';
  activeReport: StressTestReport;
  policySensitivity: number;
}

export function AlertBanners({ dataSource, activeReport, policySensitivity }: AlertBannersProps) {
  return (
    <>
      {/* DYNAMIC FAILSAFE ALERT BANNER */}
      {dataSource === 'PROCEDURAL_SIMULATION' && (
        <div className="xl:col-span-12 p-3.5 bg-amber-950/25 border border-amber-900/40 text-amber-300 font-mono text-[11px] uppercase tracking-wider flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-1.5 bg-amber-950/50 text-amber-400 border border-amber-800/40 font-bold select-none text-[10px]">
              PROXY ACTIVE
            </span>
            <span>
              Gemini API live connection holds status offline (429 rate limit). Engaging sovereign climate fallback matrix.
            </span>
          </div>
          <span className="text-amber-500/50 text-[10px] md:text-right">
            LOCAL_COMPUTATION_ACTIVE // OFFLINE_ACTUARY_0x24
          </span>
        </div>
      )}

      {/* SYSTEM SOURCE NOTIFICATION BLOCK */}
      <div className="xl:col-span-12 flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-border-dark bg-surface-dark text-xs font-mono gap-3">
        <div className="flex items-center gap-2">
          <BadgeAlert size={14} className="text-[#eab308]" />
          <div>
            <span className="text-[#888888] uppercase">PORTFOLIO BOUNDS:</span>{' '}
            <span className="text-[#e5e5e5] font-bold">{activeReport.location}</span>
            <span className="text-[#888888] ml-2">({activeReport.coordinates})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-bg-dark px-2 py-0.5 border border-border-dark">
            <Sparkles size={12} className="text-accent-gold" />
            <span className="text-[10px] text-[#e5e5e5] uppercase">
              Engine:{' '}
              {dataSource === 'AI_GENERATED'
                ? 'Gemini 3.5-Flash (LIVE)'
                : dataSource === 'PRESET'
                ? 'SWB Actuarial Blueprint'
                : 'Procedural Simulation Engine'}
            </span>
          </div>

          <div className="text-[11px] text-danger-red font-bold">
            Transits to liability in the{' '}
            <span className="underline">{activeReport.transitionLiabilityDecade}</span>
          </div>

          <div className="text-[10px] text-[#888888] uppercase tracking-wider">
            Sensitivity: <span className="text-accent-gold font-bold">{policySensitivity}/100</span>
          </div>
        </div>
      </div>
    </>
  );
}
