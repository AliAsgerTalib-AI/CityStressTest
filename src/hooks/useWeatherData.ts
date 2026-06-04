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
