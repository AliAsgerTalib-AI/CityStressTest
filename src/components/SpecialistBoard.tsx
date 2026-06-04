/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { HorizonProjection, Specialists, StressTestReport } from '../types';
import { SocialSentimentIndex } from './SocialSentimentIndex';

interface SpecialistBoardProps {
  currentProjection: HorizonProjection | null;
  selectedSpecialist: keyof Specialists;
  onSelectSpecialist: (key: keyof Specialists) => void;
  activeReport: StressTestReport | null;
  policySensitivity: number;
}

function getSpecialistLabel(key: keyof Specialists): string {
  const labels: Record<keyof Specialists, string> = {
    macroEconomist: 'Macro-Economist & Actuary',
    zoningAttorney: 'Property Zoning Attorney',
    municipalPolicy: 'Municipal Finance Director',
    structuralEngineer: 'Structural & Materials Eng',
    hydrogeologist: 'Hydrogeologist / Geologist',
    urbanSociologist: 'Urban Sociologist (QoL)',
    demographicMigration: 'Demographic Migration Expert',
    geopoliticalAnalyst: 'Sovereign Risk Analyst',
    environmentalSpecialist: 'Climate Risk Ecologist',
    insuranceActuary: 'Reinsurance Risk Actuary',
    gridUtilityEngineer: 'Infrastructure & Grid Eng',
    publicHealthEpidemiologist: 'Public Health Epidemiologist',
    socialSentiment: 'Social Sentiment Analyst',
  };
  return labels[key] || key;
}

function getSpecialistColorTag(verdict: string): string {
  switch (verdict) {
    case 'BULLISH':
      return 'text-[#F8FAFC] border-slate-500 bg-slate-900/40';
    case 'STABLE':
      return 'text-[#F8FAFC] border-[#2D2D2D] bg-[#1A1A1A]';
    case 'WATCH':
      return 'text-[#EAB308] border-[#EAB308]/40 bg-[#EAB308]/10';
    case 'BEARISH':
      return 'text-[#F97316] border-[#F97316]/40 bg-[#F97316]/10';
    case 'DIVEST':
      return 'text-[#EF4444] border-[#EF4444]/40 bg-[#EF4444]/15';
    default:
      return 'text-[#F8FAFC] border-[#2D2D2D] bg-[#1A1A1A]';
  }
}

export function SpecialistBoard({
  currentProjection,
  selectedSpecialist,
  onSelectSpecialist,
  activeReport,
  policySensitivity,
}: SpecialistBoardProps) {
  if (!currentProjection) {
    return (
      <div className="xl:col-span-4 flex flex-col gap-6">
        <div className="bg-surface-dark border border-border-dark p-5 text-center text-[#888888]">
          Enter an address to view specialist assessments.
        </div>
      </div>
    );
  }

  return (
    <div className="xl:col-span-4 flex flex-col gap-6">
      <div className="bg-surface-dark border border-border-dark p-5">
        <div className="flex items-center justify-between border-b border-border-dark pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent-gold"></span>
            <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">
              Expert Assessments
            </h3>
          </div>
        </div>

        {/* Specialist List Grid */}
        <div className="flex flex-col gap-1.5">
          {(Object.keys(currentProjection.specialists) as Array<keyof Specialists>).map((key) => {
            const spec = currentProjection.specialists[key];
            if (!spec) return null;
            const isSelected = selectedSpecialist === key;
            return (
              <button
                key={key}
                onClick={() => onSelectSpecialist(key)}
                className={`text-left p-3 border transition-all flex items-center justify-between relative cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a1a1a] border-accent-gold text-accent-gold'
                    : 'bg-bg-dark border-border-dark hover:bg-surface-dark hover:border-[#888888] text-[#888888]'
                }`}
              >
                {isSelected && <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-accent-gold" />}

                <div className="flex items-center gap-2 pl-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-600">
                    {key === 'macroEconomist'
                      ? 'EP.01'
                      : key === 'zoningAttorney'
                      ? 'ZR.02'
                      : key === 'municipalPolicy'
                      ? 'MF.03'
                      : key === 'structuralEngineer'
                      ? 'SM.04'
                      : key === 'hydrogeologist'
                      ? 'HG.05'
                      : key === 'urbanSociologist'
                      ? 'US.06'
                      : key === 'demographicMigration'
                      ? 'DM.07'
                      : key === 'geopoliticalAnalyst'
                      ? 'SR.08'
                      : key === 'environmentalSpecialist'
                      ? 'EE.09'
                      : key === 'insuranceActuary'
                      ? 'IA.10'
                      : key === 'gridUtilityEngineer'
                      ? 'GC.11'
                      : key === 'publicHealthEpidemiologist'
                      ? 'HE.12'
                      : 'SS.13'}
                  </span>
                  <span className="text-xs font-bold leading-tight select-none">
                    {getSpecialistLabel(key)}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-mono font-extrabold border px-2 py-0.5 tracking-wider ${getSpecialistColorTag(
                    spec.verdict
                  )}`}
                >
                  {spec.verdict}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Specialist Diagnostic Commentary */}
        {selectedSpecialist === 'socialSentiment' ? (
          <SocialSentimentIndex
            location={activeReport?.location || 'Miami Beach, FL'}
            horizon={currentProjection?.horizon || 5}
            policySensitivity={policySensitivity}
            verdict={currentProjection?.specialists.socialSentiment || { verdict: 'STABLE', narrative: '' }}
          />
        ) : (
          <div className="mt-5 p-4 bg-bg-dark border border-border-dark min-h-[140px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent-gold uppercase pb-2 border-b border-[#222] mb-2 font-semibold">
                <FileText size={12} />
                <span>DIAGNOSTIC BLOCK // {getSpecialistLabel(selectedSpecialist)?.toUpperCase()}</span>
              </div>
              <p className="text-xs text-[#c4c7c7] leading-relaxed italic">
                "{currentProjection.specialists[selectedSpecialist]?.narrative ||
                  'Diagnostic pipeline gathering metrics...'}"
              </p>
            </div>

            <div className="text-[10px] font-mono text-[#888888] mt-4 flex items-center justify-between">
              <span>ACTUARIAL REFERENCE: DEC-STX-914</span>
              <span className="text-accent-gold uppercase font-bold">REVISION {currentProjection.year}</span>
            </div>
          </div>
        )}
      </div>

      {/* Transition Threshold Matrix */}
      <div className="bg-surface-dark border border-border-dark p-5">
        <div className="flex items-center gap-2 border-b border-border-dark pb-3 mb-4">
          <AlertTriangle size={15} className="text-danger-red" />
          <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">
            Transition Threshold Matrix
          </h3>
        </div>
        <div className="font-mono text-xs text-[#eab308] leading-relaxed">
          <span className="text-[#888888] uppercase text-[10px]">Transition Decade:</span>
          <p className="text-danger-red text-lg font-extrabold tracking-widest mt-0.5">
            {activeReport?.transitionLiabilityDecade}
          </p>

          <span className="text-[#888888] uppercase text-[10px] mt-3 block">Trigger Mechanics:</span>
          <p className="text-[#e5e5e5] text-xs leading-normal mt-1 bg-bg-dark p-3 border border-border-dark border-l-2 border-l-danger-red">
            {activeReport?.transitionTriggerCause}
          </p>
        </div>
      </div>
    </div>
  );
}
