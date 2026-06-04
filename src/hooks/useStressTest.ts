// src/hooks/useStressTest.ts
import React from 'react';
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
