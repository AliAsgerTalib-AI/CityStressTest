# App.tsx Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor App.tsx from 2500-line monolith into ~200-line component + AppStateContext + 5 custom hooks + 8 focused sub-components. Remove PDF export entirely.

**Architecture:** Centralized state management via AppStateContext. Custom hooks (useStressTest, useWeatherData, useForecastingModels, usePolicySensitivity, useUIState) read/write to context. Sub-components are stateless, consume hooks via props. Clear separation of concerns: business logic in hooks, UI rendering in components.

**Tech Stack:** React 19, TypeScript, Recharts, html2canvas (for non-PDF capturing), D3, Lucide icons, existing imports.

---

## File Structure

**New files to create:**
- `src/context/AppStateContext.tsx` — State + provider
- `src/hooks/useStressTest.ts` — Address input, API calls
- `src/hooks/useWeatherData.ts` — Weather fetching
- `src/hooks/useForecastingModels.ts` — Forecasting logic
- `src/hooks/usePolicySensitivity.ts` — Policy modulation
- `src/hooks/useUIState.ts` — UI navigation state
- `src/components/Header.tsx` — Search bar + title
- `src/components/LoadingOverlay.tsx` — Loading modal
- `src/components/ErrorDisplay.tsx` — Error modal
- `src/components/AlertBanners.tsx` — Alert banners
- `src/components/PolicySensitivityPanel.tsx` — Policy slider panel
- `src/components/SpecialistBoard.tsx` — Left panel (specialists + transition)
- `src/components/HorizonChart.tsx` — Right panel chart
- `src/components/ForecastingTab.tsx` — Forecasting controls + viz

**Files to modify:**
- `src/App.tsx` — Refactor to use context + hooks (from 2500 to ~200 lines)

**Files unchanged:**
- `src/types.ts`
- `src/components/GeographicThreatOverlay.tsx`
- `src/components/SocialSentimentIndex.tsx`
- `src/utils/*`

---

## Tasks

### Task 1: Create AppStateContext.tsx

**Files:**
- Create: `src/context/AppStateContext.tsx`

- [ ] **Step 1: Write AppStateContext with state interface and reducer**

```typescript
// src/context/AppStateContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { StressTestReport, Specialists } from '../types';

export interface AppState {
  // Stress Test
  report: StressTestReport | null;
  addressInput: string;
  dataSource: 'AI_GENERATED' | 'PROCEDURAL_SIMULATION' | 'PRESET';

  // Weather
  currentWeather: any | null;
  historicalWeatherData: any | null;
  useRealHistory: boolean;

  // Forecasting
  forecastTarget: 'temp' | 'precip' | 'subsidence';
  forecastModel: 'arima' | 'lstm' | 'cmip';
  fittedData: {
    data: any[];
    diagnostics: any;
    lossCurve?: number[];
  } | null;
  isTraining: boolean;
  trainingLogs: string[];
  trainingProgress: number;

  // Forecasting Parameters
  arimaParams: { p: number; d: number; q: number };
  lstmParams: { epochs: number; neurons: number; learningRate: number };
  cmipParams: { pathway: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5' };
  ciConfidence: number;

  // UI State
  selectedHorizonIndex: number;
  selectedSpecialist: keyof Specialists;
  activeTab: 'readouts' | 'forecaster';
  policySensitivity: number;

  // Loading & Errors
  isLoading: boolean;
  loadingLog: string;
  error: string | null;
  isWeatherLoading: boolean;
  isHistoryLoading: boolean;
}

const initialState: AppState = {
  report: null,
  addressInput: '',
  dataSource: 'AI_GENERATED',
  currentWeather: null,
  historicalWeatherData: null,
  useRealHistory: false,
  forecastTarget: 'temp',
  forecastModel: 'arima',
  fittedData: null,
  isTraining: false,
  trainingLogs: [],
  trainingProgress: 0,
  arimaParams: { p: 2, d: 1, q: 2 },
  lstmParams: { epochs: 80, neurons: 32, learningRate: 0.01 },
  cmipParams: { pathway: 'SSP2-4.5' },
  ciConfidence: 0.95,
  selectedHorizonIndex: 0,
  selectedSpecialist: 'macroEconomist',
  activeTab: 'readouts',
  policySensitivity: 50,
  isLoading: false,
  loadingLog: '',
  error: null,
  isWeatherLoading: false,
  isHistoryLoading: false,
};

type AppAction = {
  [K in keyof AppState]?: AppState[K];
};

const reducer = (state: AppState, action: AppAction): AppState => {
  return { ...state, ...action };
};

const AppStateContext = createContext<
  { state: AppState; dispatch: (action: AppAction) => void } | undefined
>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
```

- [ ] **Step 2: Verify the file is syntactically correct**

Run: `npm run lint`
Expected: No errors in `src/context/AppStateContext.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/context/AppStateContext.tsx
git commit -m "feat: create AppStateContext with centralized state management"
```

---

### Task 2: Create useStressTest hook

**Files:**
- Create: `src/hooks/useStressTest.ts`

- [ ] **Step 1: Write useStressTest hook**

```typescript
// src/hooks/useStressTest.ts
import { useAppState } from '../context/AppStateContext';
import { StressTestReport } from '../types';

export function useStressTest() {
  const { state, dispatch } = useAppState();

  const handleEvaluateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.addressInput.trim()) return;

    dispatch({
      isLoading: true,
      error: null,
      loadingLog: 'Connecting to climate analysis service...',
    });

    const logs = [
      'Loading specialist data...',
      'Calculating property projections...',
      'Fetching environmental data...',
      'Running climate models...',
      'Finalizing report...',
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        dispatch({ loadingLog: logs[logIdx] });
        logIdx++;
      }
    }, 450);

    try {
      const response = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: state.addressInput.trim() }),
      });

      const data = await response.json();

      clearInterval(interval);

      if (data.report) {
        dispatch({
          report: data.report,
          dataSource: data.source || 'AI_GENERATED',
          selectedHorizonIndex: 0,
          isLoading: false,
        });
      } else {
        throw new Error(data.error || 'Failed appraisal generation.');
      }
    } catch (err: any) {
      clearInterval(interval);
      dispatch({
        error: err.message || 'The Climate Intelligence link failed to retrieve dynamic assets.',
        report: null,
        isLoading: false,
      });
    }
  };

  const clearError = () => {
    dispatch({ error: null });
  };

  return {
    addressInput: state.addressInput,
    setAddressInput: (val: string) => dispatch({ addressInput: val }),
    report: state.report,
    dataSource: state.dataSource,
    isLoading: state.isLoading,
    loadingLog: state.loadingLog,
    error: state.error,
    handleEvaluateSearch,
    clearError,
  };
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors in `src/hooks/useStressTest.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useStressTest.ts
git commit -m "feat: create useStressTest hook for address input and API calls"
```

---

### Task 3: Create useWeatherData hook

**Files:**
- Create: `src/hooks/useWeatherData.ts`

- [ ] **Step 1: Write useWeatherData hook**

```typescript
// src/hooks/useWeatherData.ts
import { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';

export function useWeatherData() {
  const { state, dispatch } = useAppState();

  const fetchWeatherAndHistory = async (locationName: string) => {
    dispatch({ isWeatherLoading: true, isHistoryLoading: true });

    // Fetch current weather
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(locationName)}`);
      if (!res.ok) throw new Error('Could not fetch current weather statistics.');
      const data = await res.json();
      dispatch({ currentWeather: data, isWeatherLoading: false });
    } catch (err: any) {
      console.error(err);
      dispatch({ currentWeather: null, isWeatherLoading: false });
    }

    // Fetch historical weather
    try {
      const res = await fetch(`/api/weather/historical?location=${encodeURIComponent(locationName)}`);
      if (!res.ok) throw new Error('Could not compile historical weather baseline.');
      const data = await res.json();
      dispatch({ historicalWeatherData: data, isHistoryLoading: false });
    } catch (err) {
      console.error(err);
      dispatch({ historicalWeatherData: null, useRealHistory: false, isHistoryLoading: false });
    }
  };

  // Fetch weather when location changes
  useEffect(() => {
    if (state.report?.location) {
      fetchWeatherAndHistory(state.report.location);
    }
  }, [state.report?.location]);

  return {
    currentWeather: state.currentWeather,
    historicalWeatherData: state.historicalWeatherData,
    useRealHistory: state.useRealHistory,
    setUseRealHistory: (val: boolean) => dispatch({ useRealHistory: val }),
    isWeatherLoading: state.isWeatherLoading,
    isHistoryLoading: state.isHistoryLoading,
  };
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWeatherData.ts
git commit -m "feat: create useWeatherData hook for weather API calls"
```

---

### Task 4: Create useForecastingModels hook

**Files:**
- Create: `src/hooks/useForecastingModels.ts`

- [ ] **Step 1: Write useForecastingModels hook**

```typescript
// src/hooks/useForecastingModels.ts
import { useEffect, useRef } from 'react';
import { useAppState } from '../context/AppStateContext';
import { runArimaModel, runLstmModel, runCmipEnsemble } from '../utils/climateModels';

export function useForecastingModels() {
  const { state, dispatch } = useAppState();
  const trainingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const runActuarialForecast = (locationName?: string) => {
    const loc = locationName || state.report?.location || 'Miami Beach, Coastal Florida';
    const historyToUse = state.useRealHistory ? state.historicalWeatherData : null;

    try {
      let res;
      if (state.forecastModel === 'arima') {
        res = runArimaModel(
          loc,
          state.forecastTarget,
          state.arimaParams.p,
          state.arimaParams.d,
          state.arimaParams.q,
          state.ciConfidence,
          historyToUse
        );
      } else if (state.forecastModel === 'lstm') {
        res = runLstmModel(
          loc,
          state.forecastTarget,
          state.lstmParams.epochs,
          state.lstmParams.neurons,
          state.lstmParams.learningRate,
          state.ciConfidence,
          historyToUse
        );
      } else {
        res = runCmipEnsemble(
          loc,
          state.forecastTarget,
          state.cmipParams.pathway,
          state.ciConfidence,
          historyToUse
        );
      }
      dispatch({ fittedData: res });
    } catch (err) {
      console.error('Forecasting model error:', err);
    }
  };

  const triggerModelBacktest = () => {
    if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current);

    dispatch({
      isTraining: true,
      trainingProgress: 0,
      trainingLogs: [],
    });

    const loc = state.report?.location || 'Miami Beach, Coastal Florida';
    const messages = [
      `[PROCESS INIT] LOADED GEOGRAPHIC VECTOR DATASET FOR ${loc.toUpperCase()}`,
      `[TENSOR ALLOC] ASSIGNING FLOATING ARRAYS IN WORKSPACE RESID ... SHAPE: [46, 1]`,
      state.forecastModel === 'arima'
        ? `[ARIMA SOLVER] INITIATING POLAR LEAST-SQUARES ARMA(${state.arimaParams.p},${state.arimaParams.d},${state.arimaParams.q}) ESTIMATES...`
        : state.forecastModel === 'lstm'
        ? `[NEURAL COMPILE] OPENING BACKPROP TENSORS ACROSS ${state.lstmParams.neurons} RNN RECURRENT CELLS...`
        : `[CMIP6 INTEGRATOR] COMPILING GCM ASSEMBLY SPECTRUM PATHWAYS (${state.cmipParams.pathway})...`,
    ];

    let currentProgress = 0;
    let logIndex = 0;

    trainingIntervalRef.current = setInterval(() => {
      currentProgress += 20;
      dispatch({ trainingProgress: currentProgress });

      if (logIndex < messages.length) {
        dispatch((prevState: any) => ({
          trainingLogs: [...(prevState.trainingLogs || []), messages[logIndex]],
        }));
        logIndex++;
      } else if (state.forecastModel === 'lstm') {
        const epochStep = Math.round((currentProgress / 100) * state.lstmParams.epochs);
        const currentLoss =
          (state.forecastTarget === 'precip' ? 1800 : 35.0) / Math.pow(epochStep || 1, 0.4);
        dispatch((prevState: any) => ({
          trainingLogs: [
            ...(prevState.trainingLogs || []),
            `[LSTM EPOCH ${epochStep}/${state.lstmParams.epochs}] MULTI-LAYER GRU/CELL LOSS COEFFICIENT: ${currentLoss.toFixed(4)}`,
          ],
        }));
      } else if (state.forecastModel === 'arima') {
        const estError = 0.12 + (100 - currentProgress) * 0.004;
        dispatch((prevState: any) => ({
          trainingLogs: [
            ...(prevState.trainingLogs || []),
            `[ARIMA COEFF GRAD] AIC IMPROVEMENT IN DIFFERENCE SPACE ... RESID SE: ${estError.toFixed(4)}`,
          ],
        }));
      } else {
        dispatch((prevState: any) => ({
          trainingLogs: [
            ...(prevState.trainingLogs || []),
            `[CMIP ENSEMBLE] RESOLVING RADIATIVE FORCING SPREAD ENVELOPES FOR ${state.cmipParams.pathway}...`,
          ],
        }));
      }

      if (currentProgress >= 100) {
        if (trainingIntervalRef.current) {
          clearInterval(trainingIntervalRef.current);
          trainingIntervalRef.current = null;
        }
        setTimeout(() => {
          runActuarialForecast();
          dispatch({ isTraining: false });
        }, 150);
      }
    }, 200);
  };

  // Auto-run forecast on parameter changes
  useEffect(() => {
    if (!state.isTraining) {
      runActuarialForecast();
    }
  }, [
    state.report?.location,
    state.forecastTarget,
    state.forecastModel,
    state.arimaParams,
    state.lstmParams,
    state.cmipParams,
    state.ciConfidence,
    state.useRealHistory,
    state.historicalWeatherData,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trainingIntervalRef.current) {
        clearInterval(trainingIntervalRef.current);
      }
    };
  }, []);

  return {
    forecastTarget: state.forecastTarget,
    setForecastTarget: (val: 'temp' | 'precip' | 'subsidence') =>
      dispatch({ forecastTarget: val }),
    forecastModel: state.forecastModel,
    setForecastModel: (val: 'arima' | 'lstm' | 'cmip') => dispatch({ forecastModel: val }),
    arimaParams: state.arimaParams,
    setArimaParams: (partial: Partial<typeof state.arimaParams>) =>
      dispatch({ arimaParams: { ...state.arimaParams, ...partial } }),
    lstmParams: state.lstmParams,
    setLstmParams: (partial: Partial<typeof state.lstmParams>) =>
      dispatch({ lstmParams: { ...state.lstmParams, ...partial } }),
    cmipPathway: state.cmipParams.pathway,
    setCmipPathway: (val: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5') =>
      dispatch({ cmipParams: { pathway: val } }),
    ciConfidence: state.ciConfidence,
    setCiConfidence: (val: number) => dispatch({ ciConfidence: val }),
    fittedData: state.fittedData,
    isTraining: state.isTraining,
    trainingLogs: state.trainingLogs,
    trainingProgress: state.trainingProgress,
    triggerModelBacktest,
    runActuarialForecast,
  };
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useForecastingModels.ts
git commit -m "feat: create useForecastingModels hook for climate model management"
```

---

### Task 5: Create usePolicySensitivity hook

**Files:**
- Create: `src/hooks/usePolicySensitivity.ts`

- [ ] **Step 1: Write usePolicySensitivity hook**

```typescript
// src/hooks/usePolicySensitivity.ts
import { useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { modulateReportWithSensitivity } from '../utils/stressTestUtils';
import { StressTestReport } from '../types';

export function usePolicySensitivity() {
  const { state, dispatch } = useAppState();

  const activeReport: StressTestReport | null = useMemo(() => {
    if (!state.report) return null;
    return modulateReportWithSensitivity(state.report, state.policySensitivity);
  }, [state.report, state.policySensitivity]);

  return {
    policySensitivity: state.policySensitivity,
    setPolicySensitivity: (val: number) => dispatch({ policySensitivity: val }),
    activeReport,
  };
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePolicySensitivity.ts
git commit -m "feat: create usePolicySensitivity hook for policy modulation"
```

---

### Task 6: Create useUIState hook

**Files:**
- Create: `src/hooks/useUIState.ts`

- [ ] **Step 1: Write useUIState hook**

```typescript
// src/hooks/useUIState.ts
import { useAppState } from '../context/AppStateContext';
import { Specialists, HorizonProjection } from '../types';

export function useUIState(activeReport: any) {
  const { state, dispatch } = useAppState();

  const currentProjection: HorizonProjection | null = activeReport
    ? activeReport.projections[state.selectedHorizonIndex]
    : null;

  return {
    selectedHorizonIndex: state.selectedHorizonIndex,
    setSelectedHorizonIndex: (idx: number) => dispatch({ selectedHorizonIndex: idx }),
    selectedSpecialist: state.selectedSpecialist,
    setSelectedSpecialist: (key: keyof Specialists) => dispatch({ selectedSpecialist: key }),
    activeTab: state.activeTab,
    setActiveTab: (tab: 'readouts' | 'forecaster') => dispatch({ activeTab: tab }),
    currentProjection,
  };
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUIState.ts
git commit -m "feat: create useUIState hook for UI navigation"
```

---

### Task 7: Create Header component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Write Header component**

```typescript
// src/components/Header.tsx
import React from 'react';
import { MapPin, Search } from 'lucide-react';

interface HeaderProps {
  addressInput: string;
  onAddressChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  dataSource: string;
}

export function Header({
  addressInput,
  onAddressChange,
  onSubmit,
  isLoading,
  dataSource,
}: HeaderProps) {
  return (
    <header className="h-[80px] border-b border-border-dark px-6 lg:px-8 bg-bg-dark flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border border-accent-gold flex items-center justify-center font-serif text-accent-gold font-bold text-lg select-none bg-surface-dark/40">
          S
        </div>
        <div>
          <h1 className="text-base font-serif italic tracking-widest text-accent-gold">
            Climate Stress Test
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={onSubmit} className="flex border border-border-dark bg-surface-dark items-center">
          <span className="pl-3 pr-1 text-[#888888]">
            <MapPin size={14} />
          </span>
          <input
            type="text"
            placeholder="Address / coordinates / parcel..."
            value={addressInput}
            onChange={(e) => onAddressChange(e.target.value)}
            className="px-2 py-2 focus:outline-none bg-transparent text-xs text-[#e5e5e5] font-mono w-[220px] lg:w-[320px] rounded-none placeholder:text-[#555555]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-surface-dark hover:bg-[#1a1a1a] hover:text-[#e5e5e5] text-[#888888] border-l border-border-dark px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Search size={12} className="text-accent-gold" />
            STRESS TEST
          </button>
        </form>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: create Header component"
```

---

### Task 8: Create LoadingOverlay component

**Files:**
- Create: `src/components/LoadingOverlay.tsx`

- [ ] **Step 1: Write LoadingOverlay component**

```typescript
// src/components/LoadingOverlay.tsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface LoadingOverlayProps {
  isLoading: boolean;
  loadingLog: string;
}

export function LoadingOverlay({ isLoading, loadingLog }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-6 border-4 border-border-dark"
        >
          <div className="max-w-md w-full bg-surface-dark border border-accent-gold p-8 text-center rounded-none font-mono">
            <div className="flex justify-center mb-6">
              <RefreshCw size={36} className="text-accent-gold animate-spin" />
            </div>
            <h2 className="text-[#e5e5e5] font-extrabold text-sm tracking-wider uppercase mb-2">
              Analyzing Property Risk
            </h2>
            <p className="text-[10px] text-[#888888] uppercase tracking-widest mb-6">
              Processing climate data
            </p>

            <div className="bg-bg-dark border border-border-dark p-4 text-left text-xs min-h-[90px] flex items-center">
              <div className="text-accent-gold leading-relaxed">
                <span className="text-[#888888]">[SYSTEM ACTIVE]</span> {loadingLog}
              </div>
            </div>

            <div className="mt-6 text-[9px] text-[#888888] uppercase tracking-widest">
              Please wait...
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/LoadingOverlay.tsx
git commit -m "feat: create LoadingOverlay component"
```

---

### Task 9: Create ErrorDisplay component

**Files:**
- Create: `src/components/ErrorDisplay.tsx`

- [ ] **Step 1: Write ErrorDisplay component**

```typescript
// src/components/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-[#0a0a0a] border-2 border-red-950 p-8 rounded-none font-mono text-[#e5e5e5] relative shadow-2xl">
        <div className="absolute right-3 top-3 text-red-500/10 text-4xl select-none font-extrabold pointer-events-none">
          ERROR_0xCF4
        </div>
        <div className="flex items-center gap-3 text-red-500 mb-6 font-mono font-bold">
          <span className="p-2 border border-red-950 bg-red-950/20 text-red-400">⚡</span>
          <div>
            <h3 className="font-extrabold text-sm tracking-wider uppercase text-red-400">
              Sovereign Link Terminated
            </h3>
            <p className="text-[10px] text-red-500/70 tracking-widest uppercase">
              Climate Intelligence Feed Offline
            </p>
          </div>
        </div>

        <p className="text-xs text-[#a3a3a3] leading-relaxed mb-6 font-sans">
          The application could not retrieve real-time grounded climate records from our sovereign
          search-grounded model. This occurs if the <strong className="text-accent-gold">GEMINI_API_KEY</strong> environment
          secret is not configured in the workspace settings, or if the server cannot reach external
          satellite coordinates.
        </p>

        <div className="bg-black border border-red-950/40 p-4 rounded-none text-[10px] text-red-400/80 mb-6 font-mono whitespace-pre-wrap max-h-[150px] overflow-auto">
          {error}
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-red-950/30 hover:bg-red-900/20 text-red-400 border border-red-900/60 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-200"
        >
          🔄 RE-ESTABLISH CONNECTION
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorDisplay.tsx
git commit -m "feat: create ErrorDisplay component"
```

---

### Task 10: Create AlertBanners component

**Files:**
- Create: `src/components/AlertBanners.tsx`

- [ ] **Step 1: Write AlertBanners component (no PDF button)**

```typescript
// src/components/AlertBanners.tsx
import React from 'react';
import { BadgeAlert, Sparkles } from 'lucide-react';
import { StressTestReport } from '../types';

interface AlertBannersProps {
  dataSource: string;
  activeReport: StressTestReport | null;
  policySensitivity: number;
}

export function AlertBanners({ dataSource, activeReport, policySensitivity }: AlertBannersProps) {
  return (
    <>
      {/* Fallback warning banner */}
      {dataSource === 'PROCEDURAL_SIMULATION' && (
        <div className="xl:col-span-12 p-3.5 bg-amber-950/25 border border-amber-900/40 text-amber-300 font-mono text-[11px] uppercase tracking-wider flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-1.5 bg-amber-950/50 text-amber-400 border border-amber-800/40 font-bold select-none text-[10px]">
              ⚠️ PROXY ACTIVE
            </span>
            <span>
              Gemini API live connection holds status offline (429 rate limit). Engaging sovereign
              climate fallback matrix.
            </span>
          </div>
          <span className="text-amber-500/50 text-[10px] md:text-right">
            LOCAL_COMPUTATION_ACTIVE // OFFLINE_ACTUARY_0x24
          </span>
        </div>
      )}

      {/* Status notification banner */}
      {activeReport && (
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
              ⚠️ Transits to liability in the <span className="underline">{activeReport.transitionLiabilityDecade}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AlertBanners.tsx
git commit -m "feat: create AlertBanners component (no PDF export)"
```

---

### Task 11: Create PolicySensitivityPanel component

**Files:**
- Create: `src/components/PolicySensitivityPanel.tsx`

- [ ] **Step 1: Write PolicySensitivityPanel component**

```typescript
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
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/PolicySensitivityPanel.tsx
git commit -m "feat: create PolicySensitivityPanel component"
```

---

### Task 12: Create SpecialistBoard component

**Files:**
- Create: `src/components/SpecialistBoard.tsx`

- [ ] **Step 1: Write SpecialistBoard component**

```typescript
// src/components/SpecialistBoard.tsx
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
            policySensitivity={50}
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
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/SpecialistBoard.tsx
git commit -m "feat: create SpecialistBoard component"
```

---

### Task 13: Create HorizonChart component

**Files:**
- Create: `src/components/HorizonChart.tsx`

- [ ] **Step 1: Write HorizonChart component**

```typescript
// src/components/HorizonChart.tsx
import React from 'react';
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

interface HorizonChartProps {
  activeReport: StressTestReport | null;
  currentProjection: HorizonProjection | null;
  selectedHorizonIndex: number;
  onSelectHorizon: (idx: number) => void;
  chartData: any[];
}

function CustomChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-3 text-left rounded-none font-mono text-xs">
        <p className="text-[#F8FAFC] font-semibold mb-1">Year: {data.year}</p>
        <p className="text-[#F97316]">SFH Value: ${(data.value / 1000).toFixed(0)}k</p>
        {data.utilityOpExIncrease && (
          <p className="text-[#EAB308] mt-1">OpEx: {data.utilityOpExIncrease}</p>
        )}
      </div>
    );
  }
  return null;
}

export function HorizonChart({
  activeReport,
  currentProjection,
  selectedHorizonIndex,
  onSelectHorizon,
  chartData,
}: HorizonChartProps) {
  if (!activeReport || !currentProjection) {
    return (
      <div className="xl:col-span-8 bg-surface-dark border border-border-dark p-8 text-center text-[#888888]">
        Enter an address to view horizon projections.
      </div>
    );
  }

  return (
    <div className="xl:col-span-8 bg-surface-dark border border-border-dark p-5">
      <div className="flex items-center justify-between border-b border-border-dark pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-accent-gold"></span>
          <h3 className="text-xs font-extrabold tracking-widest text-[#e5e5e5] uppercase font-mono">
            100-Year Valuation Projection
          </h3>
        </div>
      </div>

      {/* Horizon Selector Buttons */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {activeReport.projections.map((proj, idx) => (
          <button
            key={idx}
            onClick={() => onSelectHorizon(idx)}
            className={`px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap border transition-all ${
              idx === selectedHorizonIndex
                ? 'bg-accent-gold text-bg-dark border-accent-gold'
                : 'bg-bg-dark border-border-dark text-[#888888] hover:border-[#888888]'
            }`}
          >
            {proj.horizon}Yr ({proj.year})
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 -mx-5 px-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4A77D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#C4A77D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
            <XAxis dataKey="horizon" stroke="#888888" style={{ fontSize: '11px' }} />
            <YAxis stroke="#888888" style={{ fontSize: '11px' }} />
            <Tooltip content={<CustomChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#C4A77D"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 bg-bg-dark border border-border-dark">
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-[#888888] uppercase block text-[10px] mb-1">Status</span>
            <span className="text-[#e5e5e5] font-bold">{currentProjection.status}</span>
          </div>
          <div>
            <span className="text-[#888888] uppercase block text-[10px] mb-1">Insurance Gap</span>
            <span className="text-[#e5e5e5] font-bold">{currentProjection.liabilityCoverageGap}</span>
          </div>
          <div>
            <span className="text-[#888888] uppercase block text-[10px] mb-1">Pricing</span>
            <span className="text-[#e5e5e5] font-bold">
              ${(currentProjection.pricingPoint.value / 1000).toFixed(0)}k {currentProjection.pricingPoint.label}
            </span>
          </div>
          <div>
            <span className="text-[#888888] uppercase block text-[10px] mb-1">Asset Alpha</span>
            <span className="text-[#e5e5e5] font-bold">{currentProjection.assetAlpha}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/HorizonChart.tsx
git commit -m "feat: create HorizonChart component"
```

---

### Task 14: Create ForecastingTab component

**Files:**
- Create: `src/components/ForecastingTab.tsx`

- [ ] **Step 1: Write ForecastingTab component (large, ~300 lines)**

```typescript
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
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ForecastingTab.tsx
git commit -m "feat: create ForecastingTab component"
```

---

### Task 15: Refactor App.tsx to use context + hooks + components

**Files:**
- Modify: `src/App.tsx` (from ~2500 lines to ~200 lines)

- [ ] **Step 1: Replace App.tsx with new refactored version using context and hooks**

```typescript
// src/App.tsx
import React from 'react';
import { AppStateProvider } from './context/AppStateContext';
import { useStressTest } from './hooks/useStressTest';
import { useWeatherData } from './hooks/useWeatherData';
import { useForecastingModels } from './hooks/useForecastingModels';
import { usePolicySensitivity } from './hooks/usePolicySensitivity';
import { useUIState } from './hooks/useUIState';
import { Header } from './components/Header';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AlertBanners } from './components/AlertBanners';
import { PolicySensitivityPanel } from './components/PolicySensitivityPanel';
import { SpecialistBoard } from './components/SpecialistBoard';
import { HorizonChart } from './components/HorizonChart';
import { ForecastingTab } from './components/ForecastingTab';
import { GeographicThreatOverlay } from './components/GeographicThreatOverlay';

function AppContent() {
  const stressTest = useStressTest();
  const weather = useWeatherData();
  const forecasting = useForecastingModels();
  const policy = usePolicySensitivity();
  const ui = useUIState(policy.activeReport);

  // Prepare chart data
  const chartData =
    policy.activeReport?.projections.map((proj) => ({
      horizon: `${proj.horizon}Yr`,
      year: proj.year,
      value: proj.pricingPoint.value,
      opacity: proj.horizon === ui.currentProjection?.horizon ? 1 : 0.6,
      utilityOpExIncrease: proj.pricingPoint.utilityOpExIncrease,
    })) || [];

  return (
    <div className="min-h-screen bg-bg-dark text-[#e5e5e5] font-sans antialiased selection:bg-accent-gold selection:text-black">
      {/* Header */}
      <Header
        addressInput={stressTest.addressInput}
        onAddressChange={stressTest.setAddressInput}
        onSubmit={stressTest.handleEvaluateSearch}
        isLoading={stressTest.isLoading}
        dataSource={stressTest.dataSource}
      />

      {/* Loading Modal */}
      <LoadingOverlay
        isLoading={stressTest.isLoading}
        loadingLog={stressTest.loadingLog}
      />

      {/* Error Modal */}
      {stressTest.error && !stressTest.isLoading && (
        <ErrorDisplay error={stressTest.error} onDismiss={stressTest.clearError} />
      )}

      {/* Main Content */}
      {policy.activeReport && ui.currentProjection && (
        <div className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Alert Banners */}
          <AlertBanners
            dataSource={stressTest.dataSource}
            activeReport={policy.activeReport}
            policySensitivity={policy.policySensitivity}
          />

          {/* Geographic Threat Overlay */}
          <GeographicThreatOverlay
            activeReport={policy.activeReport}
            currentHorizon={ui.currentProjection}
            policySensitivity={policy.policySensitivity}
          />

          {/* Policy Sensitivity Panel */}
          <PolicySensitivityPanel
            policySensitivity={policy.policySensitivity}
            setPolicySensitivity={policy.setPolicySensitivity}
          />

          {/* Left Column: Specialist Board */}
          <SpecialistBoard
            currentProjection={ui.currentProjection}
            selectedSpecialist={ui.selectedSpecialist}
            onSelectSpecialist={ui.setSelectedSpecialist}
            activeReport={policy.activeReport}
            policySensitivity={policy.policySensitivity}
          />

          {/* Right Column: Tab Switcher & Content */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Tab Switcher */}
            <div className="flex border-b border-border-dark bg-surface-dark p-1 gap-1">
              <button
                onClick={() => ui.setActiveTab('readouts')}
                className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
                  ui.activeTab === 'readouts'
                    ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                }`}
              >
                📊 Risk Assessment
              </button>
              <button
                onClick={() => ui.setActiveTab('forecaster')}
                className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
                  ui.activeTab === 'forecaster'
                    ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                }`}
              >
                🔮 Climate Models
              </button>
            </div>

            {/* Tab Content: Risk Assessment */}
            {ui.activeTab === 'readouts' && (
              <HorizonChart
                activeReport={policy.activeReport}
                currentProjection={ui.currentProjection}
                selectedHorizonIndex={ui.selectedHorizonIndex}
                onSelectHorizon={ui.setSelectedHorizonIndex}
                chartData={chartData}
              />
            )}

            {/* Tab Content: Climate Models */}
            {ui.activeTab === 'forecaster' && (
              <ForecastingTab
                forecastTarget={forecasting.forecastTarget}
                setForecastTarget={forecasting.setForecastTarget}
                forecastModel={forecasting.forecastModel}
                setForecastModel={forecasting.setForecastModel}
                arimaParams={forecasting.arimaParams}
                setArimaParams={forecasting.setArimaParams}
                lstmParams={forecasting.lstmParams}
                setLstmParams={forecasting.setLstmParams}
                cmipPathway={forecasting.cmipPathway}
                setCmipPathway={forecasting.setCmipPathway}
                ciConfidence={forecasting.ciConfidence}
                setCiConfidence={forecasting.setCiConfidence}
                fittedData={forecasting.fittedData}
                isTraining={forecasting.isTraining}
                trainingLogs={forecasting.trainingLogs}
                trainingProgress={forecasting.trainingProgress}
                triggerModelBacktest={forecasting.triggerModelBacktest}
                historicalWeatherData={weather.historicalWeatherData}
                useRealHistory={weather.useRealHistory}
                setUseRealHistory={weather.setUseRealHistory}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
```

- [ ] **Step 2: Verify syntax**

Run: `npm run lint`
Expected: No errors in `src/App.tsx`

- [ ] **Step 3: Count lines to confirm refactoring**

Run: `wc -l src/App.tsx`
Expected: Output shows ~200 lines (down from ~2500)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: replace monolithic App.tsx with context + hooks + sub-components"
```

---

### Task 16: Test Feature Parity and Fix Issues

**Files:**
- Test: Browser testing, check for regressions

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts, no errors in console

- [ ] **Step 2: Test basic stress test flow in browser**

1. Open `http://localhost:5173` in browser
2. Type an address (e.g., "Miami Beach, Florida")
3. Click "STRESS TEST"
4. Verify: Loading modal appears, report generates, data renders
5. Expected: No crashes, report displays with specialists and charts

- [ ] **Step 3: Test policy sensitivity slider**

1. Move the policy slider from 0 to 100
2. Verify: Policy description updates, chart values change
3. Expected: Smooth interactions, activeReport modulates

- [ ] **Step 4: Test specialist selection**

1. Click different specialist buttons in left panel
2. Verify: Narrative text changes, verdict badge visible
3. Expected: Social Sentiment specialist renders correctly

- [ ] **Step 5: Test horizon selection**

1. Click different horizon buttons (5Yr, 10Yr, etc.)
2. Verify: Chart updates, currentProjection changes
3. Expected: Status, insurance gap, pricing update

- [ ] **Step 6: Test tab switching**

1. Click "Risk Assessment" and "Climate Models" tabs
2. Verify: Content switches, no state loss
3. Expected: Both tabs fully functional

- [ ] **Step 7: Test forecasting models**

1. Go to "Climate Models" tab
2. Change forecast model (ARIMA → LSTM → CMIP)
3. Change parameters (p/d/q, epochs, pathway)
4. Verify: Model auto-runs, fittedData updates
5. Expected: Charts and diagnostics display

- [ ] **Step 8: Test backtest animation**

1. Click "Run Backtest" button
2. Verify: Training progress bar animates, logs appear
3. Expected: Progress reaches 100%, then model runs

- [ ] **Step 9: Test error state**

1. Kill backend server or unset GEMINI_API_KEY
2. Try stress test
3. Verify: ErrorDisplay modal shows message, "RE-ESTABLISH CONNECTION" button works
4. Expected: Graceful error handling

- [ ] **Step 10: Verify PDF export removed**

1. Check AlertBanners component
2. Search page for "PDF" or "Export Portfolio"
3. Expected: No PDF button or export functionality anywhere

- [ ] **Step 11: Open browser DevTools Console**

1. Check for JavaScript errors or warnings
2. Expected: No errors (warnings OK, deprecations OK)

- [ ] **Step 12: Commit test results**

```bash
git add -A
git commit -m "test: verify feature parity and fix any regressions"
```

---

### Task 17: TypeScript Type Checking

**Files:**
- Check: Type correctness across all files

- [ ] **Step 1: Run TypeScript type check**

Run: `npm run lint`
Expected: No type errors

- [ ] **Step 2: If errors, fix them**

If TypeScript reports errors:
- Check return types in hooks
- Verify component prop types
- Ensure state dispatch actions match AppState interface

Example fix:
```typescript
// If error: "Property 'trainingLogs' not assignable"
// Ensure dispatch action matches AppState:
dispatch({ trainingLogs: [...state.trainingLogs, newLog] });
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript type errors"
```

---

### Task 18: Final Cleanup & Verification

**Files:**
- Verify all old PDF code removed
- Ensure all imports are correct
- Check for any dead code

- [ ] **Step 1: Search for PDF references**

Run: `grep -r "pdf" src/ --include="*.tsx" --include="*.ts"`
Expected: No results (or only in comments)

- [ ] **Step 2: Search for PDF imports**

Run: `grep -r "jsPDF\|html2canvas" src/ --include="*.tsx" --include="*.ts"`
Expected: No results

- [ ] **Step 3: Verify all components are imported in App.tsx**

Check `src/App.tsx` for:
- ✓ `Header` imported and used
- ✓ `LoadingOverlay` imported and used
- ✓ `ErrorDisplay` imported and used
- ✓ `AlertBanners` imported and used
- ✓ `PolicySensitivityPanel` imported and used
- ✓ `SpecialistBoard` imported and used
- ✓ `HorizonChart` imported and used
- ✓ `ForecastingTab` imported and used
- ✓ `GeographicThreatOverlay` imported (existing, unchanged)

- [ ] **Step 4: Check for unused imports**

Run: `npm run lint`
Expected: No unused import warnings

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup - remove all PDF references, verify imports"
```

---

## Summary

**Tasks completed:**
1. ✅ Created AppStateContext for centralized state management
2. ✅ Created 5 custom hooks (useStressTest, useWeatherData, useForecastingModels, usePolicySensitivity, useUIState)
3. ✅ Created 8 focused sub-components (Header, LoadingOverlay, ErrorDisplay, AlertBanners, PolicySensitivityPanel, SpecialistBoard, HorizonChart, ForecastingTab)
4. ✅ Refactored App.tsx from ~2500 to ~200 lines
5. ✅ Removed all PDF export functionality
6. ✅ Tested feature parity
7. ✅ Fixed TypeScript errors
8. ✅ Verified cleanup

**Result:** App.tsx is now modular, testable, and maintainable. All business logic is in hooks, all UI is in components, all state is centralized in context.
