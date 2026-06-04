// src/components/PolicySensitivityPanel.tsx
import React from 'react';
import { Sparkles, Globe, TrendingUp, TrendingDown, Zap, Sliders } from 'lucide-react';

interface PolicySensitivityPanelProps {
  policySensitivity: number;
  setPolicySensitivity: (val: number) => void;
}

export function PolicySensitivityPanel({
  policySensitivity,
  setPolicySensitivity,
}: PolicySensitivityPanelProps) {
  return (
    <div className="xl:col-span-12 border border-border-dark bg-[#0f1115] p-5 font-mono text-xs flex flex-col gap-4 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#222] pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full" />
          <h3 className="text-xs font-extrabold text-[#e5e5e5] uppercase tracking-wider">
            Interactive Climate Policy Sensitivity Matrix
          </h3>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 max-w-4xl leading-relaxed">
        Adjust the slider to explore different climate scenarios and see how they affect the
        property assessment.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-bg-dark/60 p-4 border border-border-dark mt-1">
        {/* Slider Control Column */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-accent-gold uppercase tracking-wider">
            <span>Carbon Target Sensitivity</span>
            <span className="bg-accent-gold/15 px-2.5 py-1 text-accent-gold border border-accent-gold/20 flex items-center gap-1.5 font-extrabold text-xs">
              <Sliders size={12} />
              Value: {policySensitivity} / 100
            </span>
          </div>

          <div className="relative mt-2">
            <input
              id="policy-sensitivity-slider"
              type="range"
              min="0"
              max="100"
              value={policySensitivity}
              onChange={(e) => setPolicySensitivity(Number(e.target.value))}
              className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-accent-gold focus:outline-none"
            />

            <div className="flex justify-between text-[9px] text-zinc-500 mt-2.5 leading-none select-none">
              <button
                onClick={() => setPolicySensitivity(0)}
                className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${
                  policySensitivity <= 10 ? 'text-emerald-400 font-extrabold' : ''
                }`}
              >
                0 (NET NEGATIVE)
              </button>
              <button
                onClick={() => setPolicySensitivity(25)}
                className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${
                  policySensitivity > 10 && policySensitivity <= 35 ? 'text-emerald-300 font-extrabold' : ''
                }`}
              >
                25 (NET ZERO 2050)
              </button>
              <button
                onClick={() => setPolicySensitivity(50)}
                className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${
                  policySensitivity > 35 && policySensitivity <= 65 ? 'text-amber-500 font-extrabold' : ''
                }`}
              >
                50 (BASELINE ACTION)
              </button>
              <button
                onClick={() => setPolicySensitivity(75)}
                className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${
                  policySensitivity > 65 && policySensitivity <= 85 ? 'text-orange-500 font-extrabold' : ''
                }`}
              >
                75 (DELAYED PENALTY)
              </button>
              <button
                onClick={() => setPolicySensitivity(100)}
                className={`hover:text-[#e5e5e5] cursor-pointer transition-colors ${
                  policySensitivity > 85 ? 'text-red-500 font-extrabold' : ''
                }`}
              >
                100 (RUNAWAY EXPANSION)
              </button>
            </div>
          </div>
        </div>

        {/* Policy Description Summary Box */}
        <div className="lg:col-span-5 bg-surface-dark border border-zinc-800 p-4 min-h-[90px] flex flex-col justify-center text-left">
          {policySensitivity < 25 ? (
            <div>
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} />
                SSP1-1.9 // COOPERATIVE DRAWDOWN
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Global net negative emissions active. Artificial capture tech scales aggressively.
                Wet-bulb warming is capped under +1.3°C, reclaiming high long-term property
                valuations and fully stabilizing structural risk tables.
              </p>
            </div>
          ) : policySensitivity < 45 ? (
            <div>
              <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                <Globe size={12} />
                SSP1-2.6 // PROMPT ACTION
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Strict emissions compliance bounds met. Solid public infrastructure reinforcement
                keeps warming restricted with high physical resilience, preventing sudden actuarial
                pool withdrawals.
              </p>
            </div>
          ) : policySensitivity <= 55 ? (
            <div>
              <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={12} />
                <span className="ml-1">SSP2-4.5 // BASELINE (NEUTRAL)</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Medium-high emissions pathway with delayed climate action policies. Typical decadal
                thermal strain with localized substation stress and gradual property devaluation as
                the transition decade nears.
              </p>
            </div>
          ) : policySensitivity <= 75 ? (
            <div>
              <div className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingDown size={12} />
                <span className="ml-1">SSP3-7.0 // REGULATORY SLIPPAGE</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Frequent carbon credit defaults. Rapid warming elevates sea levels earlier. Wet
                bulb thresholds begin stymieing outdoor utility work with rolling brownouts and
                early actuarial market withdrawals.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1.5 z-10">
                <Zap size={12} />
                <span className="ml-1">SSP5-8.5 // RUNAWAY FOSSIL PATH</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Total greenhouse deregulation. Heat domes exceed organic limits. Grid structures are
                abandoned, insurance underwriters issue full retreats, and properties are written
                down as total systemic write-offs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
