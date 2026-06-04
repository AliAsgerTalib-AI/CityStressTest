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
