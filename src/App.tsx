/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
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
import { AnalysisTab } from './components/AnalysisTab';
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
              <button
                onClick={() => ui.setActiveTab('analysis')}
                className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
                  ui.activeTab === 'analysis'
                    ? 'bg-accent-gold text-bg-dark border-accent-gold font-bold'
                    : 'bg-bg-dark border-border-dark text-[#888888] hover:text-[#e5e5e5] hover:border-[#888888]'
                }`}
              >
                📈 Analysis
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

            {/* Tab Content: Analysis */}
            {ui.activeTab === 'analysis' && policy.activeReport && ui.currentProjection && (
              <AnalysisTab
                activeReport={policy.activeReport}
                currentProjection={ui.currentProjection}
                onSelectHorizon={(horizon) => {
                  const proj = policy.activeReport?.projections.find((p) => p.horizon === horizon);
                  if (proj) {
                    ui.setCurrentProjection(proj);
                  }
                }}
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
