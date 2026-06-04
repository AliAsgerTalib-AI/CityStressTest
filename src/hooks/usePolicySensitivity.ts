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
