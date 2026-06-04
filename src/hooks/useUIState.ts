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
    setActiveTab: (tab: 'readouts' | 'forecaster' | 'analysis') => dispatch({ activeTab: tab }),
    currentProjection,
    setCurrentProjection: (projection: HorizonProjection | null) => {
      if (projection && activeReport) {
        const idx = activeReport.projections.findIndex((p: HorizonProjection) => p.horizon === projection.horizon);
        if (idx >= 0) {
          dispatch({ selectedHorizonIndex: idx });
        }
      }
    },
  };
}
