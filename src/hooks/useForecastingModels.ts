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
    let accumulatedLogs: string[] = [];

    trainingIntervalRef.current = setInterval(() => {
      currentProgress += 20;
      dispatch({ trainingProgress: currentProgress });

      if (logIndex < messages.length) {
        accumulatedLogs = [...accumulatedLogs, messages[logIndex]];
        dispatch({ trainingLogs: accumulatedLogs });
        logIndex++;
      } else if (state.forecastModel === 'lstm') {
        const epochStep = Math.round((currentProgress / 100) * state.lstmParams.epochs);
        const currentLoss =
          (state.forecastTarget === 'precip' ? 1800 : 35.0) / Math.pow(epochStep || 1, 0.4);
        accumulatedLogs = [
          ...accumulatedLogs,
          `[LSTM EPOCH ${epochStep}/${state.lstmParams.epochs}] MULTI-LAYER GRU/CELL LOSS COEFFICIENT: ${currentLoss.toFixed(4)}`,
        ];
        dispatch({ trainingLogs: accumulatedLogs });
      } else if (state.forecastModel === 'arima') {
        const estError = 0.12 + (100 - currentProgress) * 0.004;
        accumulatedLogs = [
          ...accumulatedLogs,
          `[ARIMA COEFF GRAD] AIC IMPROVEMENT IN DIFFERENCE SPACE ... RESID SE: ${estError.toFixed(4)}`,
        ];
        dispatch({ trainingLogs: accumulatedLogs });
      } else {
        accumulatedLogs = [
          ...accumulatedLogs,
          `[CMIP ENSEMBLE] RESOLVING RADIATIVE FORCING SPREAD ENVELOPES FOR ${state.cmipParams.pathway}...`,
        ];
        dispatch({ trainingLogs: accumulatedLogs });
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
