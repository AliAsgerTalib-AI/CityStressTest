// src/components/ForecastingTab.tsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Play } from 'lucide-react';

interface ForecastingTabProps {
  forecastTarget: string;
  setForecastTarget: (val: 'temp' | 'precip' | 'subsidence') => void;
  forecastModel: string;
  setForecastModel: (val: 'arima' | 'lstm' | 'cmip') => void;
  arimaParams: { p: number; d: number; q: number };
  setArimaParams: (partial: any) => void;
  lstmParams: { epochs: number; neurons: number; learningRate: number };
  setLstmParams: (partial: any) => void;
  cmipPathway: string;
  setCmipPathway: (val: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5') => void;
  ciConfidence: number;
  setCiConfidence: (val: number) => void;
  fittedData: any | null;
  isTraining: boolean;
  trainingLogs: string[];
  trainingProgress: number;
  triggerModelBacktest: () => void;
  historicalWeatherData: any | null;
  useRealHistory: boolean;
  setUseRealHistory: (val: boolean) => void;
}

export function ForecastingTab({
  forecastTarget,
  setForecastTarget,
  forecastModel,
  setForecastModel,
  arimaParams,
  setArimaParams,
  lstmParams,
  setLstmParams,
  cmipPathway,
  setCmipPathway,
  ciConfidence,
  setCiConfidence,
  fittedData,
  isTraining,
  trainingLogs,
  trainingProgress,
  triggerModelBacktest,
  historicalWeatherData,
  useRealHistory,
  setUseRealHistory,
}: ForecastingTabProps) {
  return (
    <div className="xl:col-span-8 flex flex-col gap-6">
      {/* Model Selector */}
      <div className="bg-surface-dark border border-border-dark p-5">
        <h4 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono mb-4">
          Forecasting Model Selection
        </h4>

        <div className="flex gap-3 mb-6">
          {(['arima', 'lstm', 'cmip'] as const).map((model) => (
            <button
              key={model}
              onClick={() => setForecastModel(model)}
              className={`px-4 py-2 text-xs font-mono font-bold border transition-all ${
                forecastModel === model
                  ? 'bg-accent-gold text-bg-dark border-accent-gold'
                  : 'bg-bg-dark border-border-dark text-[#888888] hover:border-[#888888]'
              }`}
            >
              {model.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Forecast Target */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-[#888888] uppercase mb-2 block">
            Forecast Target
          </label>
          <div className="flex gap-3">
            {(['temp', 'precip', 'subsidence'] as const).map((target) => (
              <label key={target} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="forecastTarget"
                  value={target}
                  checked={forecastTarget === target}
                  onChange={(e) => setForecastTarget(e.target.value as any)}
                  className="w-3 h-3"
                />
                <span className="text-xs text-[#e5e5e5]">{target === 'temp' ? 'Temperature' : target === 'precip' ? 'Precipitation' : 'Subsidence'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ARIMA Params */}
        {forecastModel === 'arima' && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-bg-dark border border-border-dark">
            {[
              { label: 'p (AR Order)', key: 'p', min: 0, max: 5 },
              { label: 'd (Differencing)', key: 'd', min: 0, max: 3 },
              { label: 'q (MA Order)', key: 'q', min: 0, max: 5 },
            ].map(({ label, key, min, max }) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-[#888888] uppercase block mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={arimaParams[key as keyof typeof arimaParams]}
                  onChange={(e) =>
                    setArimaParams({ [key]: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 bg-[#0f1115] border border-border-dark text-[#e5e5e5] text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* LSTM Params */}
        {forecastModel === 'lstm' && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-bg-dark border border-border-dark">
            {[
              { label: 'Epochs', key: 'epochs', min: 10, max: 200 },
              { label: 'Neurons', key: 'neurons', min: 8, max: 256 },
              { label: 'Learning Rate', key: 'learningRate', min: 0.0001, max: 0.1, step: 0.001 },
            ].map(({ label, key, min, max, step = 1 }) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-[#888888] uppercase block mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={lstmParams[key as keyof typeof lstmParams]}
                  onChange={(e) =>
                    setLstmParams({ [key]: parseFloat(e.target.value) })
                  }
                  className="w-full px-2 py-1 bg-[#0f1115] border border-border-dark text-[#e5e5e5] text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* CMIP Pathway */}
        {forecastModel === 'cmip' && (
          <div className="mb-6 p-4 bg-bg-dark border border-border-dark">
            <label className="text-[10px] font-bold text-[#888888] uppercase block mb-3">
              Emission Scenario Pathway
            </label>
            <div className="flex gap-3">
              {(['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'] as const).map((pathway) => (
                <button
                  key={pathway}
                  onClick={() => setCmipPathway(pathway)}
                  className={`px-3 py-1.5 text-xs font-mono border transition-all ${
                    cmipPathway === pathway
                      ? 'bg-accent-gold text-bg-dark border-accent-gold'
                      : 'bg-bg-dark border-border-dark text-[#888888] hover:border-[#888888]'
                  }`}
                >
                  {pathway}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Interval */}
        <div className="mb-6 p-4 bg-bg-dark border border-border-dark">
          <label className="text-[10px] font-bold text-[#888888] uppercase block mb-3">
            Confidence Interval: {(ciConfidence * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.80"
            max="0.99"
            step="0.01"
            value={ciConfidence}
            onChange={(e) => setCiConfidence(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-accent-gold"
          />
        </div>

        {/* Use Real History Toggle */}
        <div className="flex items-center gap-3 p-4 bg-bg-dark border border-border-dark">
          <input
            type="checkbox"
            id="useRealHistory"
            checked={useRealHistory && historicalWeatherData !== null}
            onChange={(e) => setUseRealHistory(e.target.checked)}
            disabled={!historicalWeatherData}
            className="w-4 h-4"
          />
          <label htmlFor="useRealHistory" className="text-xs text-[#e5e5e5] cursor-pointer">
            Use Real Historical Weather Data
            {!historicalWeatherData && (
              <span className="block text-[10px] text-[#888888] mt-1">
                (Historical data not available for this location)
              </span>
            )}
          </label>
        </div>

        {/* Backtest Button */}
        <button
          onClick={triggerModelBacktest}
          disabled={isTraining}
          className="w-full mt-4 bg-accent-gold hover:bg-[#b0946b] disabled:bg-zinc-800 disabled:text-zinc-500 text-bg-dark font-bold py-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          <Play size={12} />
          {isTraining ? 'Training...' : 'Run Backtest'}
        </button>
      </div>

      {/* Training Logs */}
      {isTraining && (
        <div className="bg-surface-dark border border-border-dark p-5">
          <h4 className="text-xs font-extrabold tracking-widest text-accent-gold uppercase font-mono mb-3">
            Training Progress: {trainingProgress}%
          </h4>
          <div className="w-full bg-bg-dark h-2 border border-border-dark mb-3">
            <div
              className="h-full bg-accent-gold transition-all"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <div className="bg-bg-dark border border-border-dark p-3 h-32 overflow-y-auto font-mono text-[9px] text-[#888888]">
            {trainingLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Fitted Data Visualization */}
      {fittedData && (
        <div className="bg-surface-dark border border-border-dark p-5">
          <h4 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono mb-4">
            Fitted Model Results
          </h4>

          {/* Chart */}
          <div className="h-64 -mx-5 px-5 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fittedData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                <XAxis dataKey="year" stroke="#888888" style={{ fontSize: '11px' }} />
                <YAxis stroke="#888888" style={{ fontSize: '11px' }} />
                <Tooltip />
                <ReferenceLine y={0} stroke="#888888" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#C4A77D"
                  dot={false}
                  isAnimationActive={false}
                />
                {fittedData.data[0]?.upper && (
                  <Line type="monotone" dataKey="upper" stroke="#C4A77D" strokeOpacity={0.3} dot={false} isAnimationActive={false} />
                )}
                {fittedData.data[0]?.lower && (
                  <Line type="monotone" dataKey="lower" stroke="#C4A77D" strokeOpacity={0.3} dot={false} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Diagnostics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-bg-dark border border-border-dark">
            {[
              { label: 'R²', value: fittedData.diagnostics?.r2?.toFixed(3) || 'N/A' },
              { label: 'RMSE', value: fittedData.diagnostics?.rmse?.toFixed(2) || 'N/A' },
              { label: 'MAE', value: fittedData.diagnostics?.mae?.toFixed(2) || 'N/A' },
              { label: 'Trend', value: fittedData.diagnostics?.trend || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-[10px] font-bold text-[#888888] uppercase mb-1">{label}</div>
                <div className="text-xs font-bold text-[#e5e5e5]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
