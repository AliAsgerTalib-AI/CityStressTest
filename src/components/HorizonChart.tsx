/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StressTestReport, HorizonProjection } from '../types';

interface ChartDatum {
  horizon: string;
  year: number;
  value: number;
  opacity: number;
  utilityOpExIncrease: string;
}

interface HorizonChartProps {
  activeReport: StressTestReport;
  currentProjection: HorizonProjection;
  selectedHorizonIndex: number;
  onSelectHorizon: (index: number) => void;
  chartData: ChartDatum[];
}

export function HorizonChart({
  activeReport,
  currentProjection,
  selectedHorizonIndex,
  onSelectHorizon,
  chartData,
}: HorizonChartProps) {
  // Custom tooltip for hover display (SFH value, OpEx, liability marker)
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-3 text-left rounded-none font-mono text-xs">
          <p className="text-[#F8FAFC] font-semibold mb-1">Year: {data.year}</p>
          <p className="text-[#F97316]">SFH Value: ${(data.value / 1000).toFixed(0)}k</p>
          {data.utilityOpExIncrease && (
            <p className="text-[#EAB308] mt-1">OpEx: {data.utilityOpExIncrease}</p>
          )}
          {data.year.toString() === activeReport?.transitionLiabilityDecade.replace('s', '5') && (
            <p className="text-[#EF4444] font-bold mt-1 text-[10px] uppercase">
              Liability Transition Pivot
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 border border-border-dark bg-surface-dark">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border-dark pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent-gold" />
          <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">
            100-Year SFH Pricing Dynamics (Inflation-Adjusted)
          </h3>
        </div>
        <div className="text-[10px] font-mono text-[#888888]">
          Standard Detached SFH (3-Bed // 2-Bath // Micro-Market)
        </div>
      </div>

      {/* Chart Element Frame */}
      <div className="h-[210px] w-full bg-bg-dark border border-border-dark p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pricingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c4a77d" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#c4a77d" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
            <XAxis
              dataKey="horizon"
              stroke="#888888"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#c4a77d"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#pricingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Horizon selector buttons & status summary grid */}
      <div className="grid grid-cols-8 gap-1.5 mt-3 text-center">
        {activeReport.projections.map((proj, i) => (
          <button
            key={i}
            onClick={() => onSelectHorizon(i)}
            className={`p-2 border font-mono transition-all text-[10px] cursor-pointer ${
              selectedHorizonIndex === i
                ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                : 'bg-bg-dark border-border-dark text-[#888888] hover:border-[#888888]'
            }`}
          >
            {proj.horizon}y
            <span className="block text-[8px] opacity-75">{proj.pricingPoint.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
