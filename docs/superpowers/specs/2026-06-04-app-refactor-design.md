---
name: app-refactor-context-hooks
description: Refactor App.tsx to separate business logic from UI using Context + custom hooks, remove PDF export, extract into focused sub-components
metadata:
  type: project
---

# App.tsx Refactor Design: Context + Custom Hooks

## Overview

Refactor `src/App.tsx` (currently ~2500 lines) to improve code organization and separate concerns:

- **Remove:** PDF export functionality entirely
- **Extract:** All state & data-fetching logic into custom hooks
- **Decompose:** Large monolithic component into 8-10 focused sub-components
- **Centralize:** State management via `AppStateContext` + individual hooks reading/writing to it

**Scope:** Moderate extraction — custom hooks + sub-components, no over-engineering.

---

## Architecture

### File Structure

```
src/
├── App.tsx                              (main component, ~200 lines)
├── context/
│   └── AppStateContext.tsx              (state + provider, ~300 lines)
├── hooks/
│   ├── useStressTest.ts                 (address input, API calls, ~80 lines)
│   ├── useWeatherData.ts                (weather fetching, ~60 lines)
│   ├── useForecastingModels.ts          (ARIMA/LSTM/CMIP, training, ~200 lines)
│   ├── usePolicySensitivity.ts          (policy modulation, ~40 lines)
│   └── useUIState.ts                    (UI navigation, ~40 lines)
├── components/
│   ├── Header.tsx                       (search bar + title, ~80 lines)
│   ├── LoadingOverlay.tsx               (loading modal, ~50 lines)
│   ├── ErrorDisplay.tsx                 (error modal, ~50 lines)
│   ├── SpecialistBoard.tsx              (left panel, ~150 lines)
│   ├── HorizonChart.tsx                 (right panel chart, ~100 lines)
│   ├── PolicySensitivityPanel.tsx       (slider panel, ~120 lines)
│   ├── ForecastingTab.tsx               (model controls + viz, ~300 lines)
│   ├── AlertBanners.tsx                 (warnings + status, ~80 lines)
│   └── (existing components)            (GeographicThreatOverlay, SocialSentimentIndex)
└── types.ts                             (unchanged)
```

---

## State Design (AppStateContext)

### Centralized State Object

```typescript
interface AppState {
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

  // Forecasting Parameters (grouped by model)
  arimaParams: {
    p: number;
    d: number;
    q: number;
  };
  lstmParams: {
    epochs: number;
    neurons: number;
    learningRate: number;
  };
  cmipParams: {
    pathway: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5';
  };
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
```

### Context Provider

`AppStateContext` exports:
- `useAppState()` — Returns `{ state: AppState, dispatch: (updates) => void }`
- `AppStateProvider` — Wraps the app, initializes state to defaults

Simple reducer/dispatch pattern: `dispatch({ field: value })` updates one or more fields.

---

## Custom Hooks

### `useStressTest()`

**Responsibility:** Address input, stress-test API calls, error handling, loading animation.

**Returns:**
```typescript
{
  addressInput: string;
  setAddressInput: (val: string) => void;
  report: StressTestReport | null;
  dataSource: string;
  isLoading: boolean;
  loadingLog: string;
  error: string | null;
  handleEvaluateSearch: (e: React.FormEvent) => Promise<void>;
  clearError: () => void;
}
```

**Logic:**
- Form submission triggers `handleEvaluateSearch()`
- Posts address to `/api/stress-test`
- Animates loading log with 5 predefined messages (150ms intervals)
- On success: updates `report` and `dataSource` in context
- On failure: updates `error` in context
- Clears loading state when response arrives

---

### `useWeatherData()`

**Responsibility:** Fetch current and historical weather when report location changes.

**Returns:**
```typescript
{
  currentWeather: any | null;
  historicalWeatherData: any | null;
  useRealHistory: boolean;
  setUseRealHistory: (val: boolean) => void;
  isWeatherLoading: boolean;
  isHistoryLoading: boolean;
}
```

**Logic:**
- `useEffect` watches `report?.location`
- On change, calls `fetchWeatherAndHistory(locationName)`
- Fetches `/api/weather` (current) and `/api/weather/historical` (decadal)
- Silently fails if APIs are down; forecasting has fallback synthetic data
- `useRealHistory` toggle allows forcing procedural simulation

---

### `useForecastingModels()`

**Responsibility:** ARIMA/LSTM/CMIP state, parameter controls, model execution, training animation.

**Returns:**
```typescript
{
  // Model selection
  forecastTarget: 'temp' | 'precip' | 'subsidence';
  setForecastTarget: (val) => void;
  forecastModel: 'arima' | 'lstm' | 'cmip';
  setForecastModel: (val) => void;

  // ARIMA params
  arimaParams: { p, d, q };
  setArimaParams: (partial) => void;

  // LSTM params
  lstmParams: { epochs, neurons, learningRate };
  setLstmParams: (partial) => void;

  // CMIP pathway
  cmipPathway: string;
  setCmipPathway: (val) => void;

  // Confidence interval
  ciConfidence: number;
  setCiConfidence: (val) => void;

  // Results & training state
  fittedData: any | null;
  isTraining: boolean;
  trainingLogs: string[];
  trainingProgress: number;

  // Functions
  triggerModelBacktest: () => void;  // Starts training animation + model run
  runActuarialForecast: (locationName?) => void;  // Runs model immediately
}
```

**Logic:**
- `useEffect` watches all params (`forecastTarget`, `forecastModel`, `arimaParams`, `lstmParams`, `cmipParams`, `ciConfidence`, `useRealHistory`, `historicalWeatherData`)
- Auto-runs `runActuarialForecast()` whenever any param changes (debounce optional)
- `triggerModelBacktest()` starts interval animation, simulates training logs, then runs actual model after progress reaches 100%
- `runActuarialForecast()` calls appropriate model (`runArimaModel()`, `runLstmModel()`, or `runCmipEnsemble()`) and updates `fittedData`
- Cleans up interval on unmount

---

### `usePolicySensitivity()`

**Responsibility:** Policy slider state and report modulation.

**Returns:**
```typescript
{
  policySensitivity: number;
  setPolicySensitivity: (val: number) => void;
  activeReport: StressTestReport | null;  // Modulated version
}
```

**Logic:**
- `useEffect` watches `report` and `policySensitivity`
- Calls `modulateReportWithSensitivity(report, policySensitivity)`
- Returns the modulated report for rendering
- All components read `activeReport`, not raw `report`

---

### `useUIState()`

**Responsibility:** Horizon, specialist, and tab selection.

**Returns:**
```typescript
{
  selectedHorizonIndex: number;
  setSelectedHorizonIndex: (idx: number) => void;
  selectedSpecialist: keyof Specialists;
  setSelectedSpecialist: (key) => void;
  activeTab: 'readouts' | 'forecaster';
  setActiveTab: (tab) => void;
  currentProjection: HorizonProjection | null;  // Derived from activeReport
}
```

**Logic:**
- Simple state getters/setters for UI navigation
- `currentProjection` is computed: `activeReport?.projections[selectedHorizonIndex]`
- Returns null if `activeReport` is missing

---

## Sub-Components

### `Header.tsx` (~80 lines)

**Renders:** Logo, title, search form, engine status badge.

**Props:**
- `addressInput: string`
- `onAddressChange: (val: string) => void`
- `onSubmit: (e: FormEvent) => void`
- `isLoading: boolean`
- `dataSource: string`

**No internal state.** All state passed via props, no side effects.

---

### `LoadingOverlay.tsx` (~50 lines)

**Renders:** Full-screen modal with spinner, heading, loading log.

**Props:**
- `isLoading: boolean`
- `loadingLog: string`

**Conditional:** Only renders if `isLoading === true`.

---

### `ErrorDisplay.tsx` (~50 lines)

**Renders:** Error modal with message and retry button.

**Props:**
- `error: string | null`
- `onRetry: () => void` (reloads page)
- `onDismiss: () => void` (clears error)

**Conditional:** Only renders if `error !== null`.

---

### `AlertBanners.tsx` (~80 lines)

**Renders:** Top banner(s) for:
1. Procedural simulation fallback warning (if `dataSource === 'PROCEDURAL_SIMULATION'`)
2. Engine status, location, transition liability, data source indicator

**Props:**
- `dataSource: string`
- `activeReport: StressTestReport | null`
- `policySensitivity: number`

**Changes from original:**
- **No PDF download button** — completely removed
- Rest of UI layout unchanged

---

### `PolicySensitivityPanel.tsx` (~120 lines)

**Renders:** Full slider panel with labels, policy description box.

**Props:**
- `policySensitivity: number`
- `setPolicySensitivity: (val: number) => void`

**Contains:**
- Horizontal slider (0–100)
- Notch buttons (0, 25, 50, 75, 100)
- Dynamic policy description (SSP pathway, explanation)
- All inline styles from original

---

### `SpecialistBoard.tsx` (~150 lines)

**Renders:** Left panel with specialist list + active specialist details.

**Props:**
- `currentProjection: HorizonProjection | null`
- `selectedSpecialist: keyof Specialists`
- `onSelectSpecialist: (key) => void`
- `activeReport: StressTestReport | null`
- `policySensitivity: number`

**Contains:**
1. Specialist button grid with verdicts
2. Active specialist narrative box (or `SocialSentimentIndex` if social sentiment selected)
3. Transition threshold alert box (red bar, liability decade, trigger cause)

---

### `HorizonChart.tsx` (~100 lines)

**Renders:** Right panel with Recharts AreaChart visualization.

**Props:**
- `activeReport: StressTestReport | null`
- `currentProjection: HorizonProjection | null`
- `selectedHorizonIndex: number`
- `onSelectHorizon: (idx: number) => void`
- `chartData: Array<{ horizon, year, value, opacity, utilityOpExIncrease }>`

**Contains:**
- Recharts `ResponsiveContainer`, `AreaChart`, `Area`, axes, tooltip
- Custom tooltip showing SFH value, OpEx, liability transition marker
- Click handlers on chart elements to select horizon

---

### `ForecastingTab.tsx` (~300 lines)

**Renders:** Entire "Climate Models" tab content.

**Props:**
- All from `useForecastingModels()`: `forecastTarget`, `setForecastTarget`, `forecastModel`, `setForecastModel`, etc.
- `fittedData`, `isTraining`, `trainingLogs`, `trainingProgress`, `triggerModelBacktest`, `runActuarialForecast`
- `historicalWeatherData`, `useRealHistory`, `setUseRealHistory`

**Sections:**
1. Model selector (radio buttons: ARIMA / LSTM / CMIP)
2. Parameter controls (sliders/inputs for p, d, q; epochs, neurons, learning rate; pathway selection)
3. Confidence interval slider
4. "Use Real History" toggle
5. "Backtest" button → triggers training animation + model run
6. Training log viewer (scrollable, dark background)
7. Model diagnostics cards (R², RMSE, MAE, drift trend)
8. Fitted data chart visualization (if fittedData exists)

---

### `App.tsx` (~200 lines)

**Main component.**

**Logic:**
1. Wrap everything in `AppStateProvider`
2. Call all 5 custom hooks: `useStressTest()`, `useWeatherData()`, `useForecastingModels()`, `usePolicySensitivity()`, `useUIState()`
3. Conditionally render loading/error overlays
4. Compose main layout:
   - `Header` (top)
   - `AlertBanners` (below header)
   - Main grid (xl:grid-cols-12)
     - `GeographicThreatOverlay` (full width)
     - Left column (xl:col-span-4): `SpecialistBoard` + transition threshold box
     - Right column (xl:col-span-8): Tabs + `PolicySensitivityPanel` + `HorizonChart` + `ForecastingTab`

**Exports:** Default `App` component

---

## Data Flow

### User enters address → Report generated

1. User types in `Header` search box → `setAddressInput()`
2. User clicks "STRESS TEST" → `handleEvaluateSearch()` fires
3. `useStressTest` posts to `/api/stress-test` with address
4. Response updates `report` in context; `dataSource` set (AI_GENERATED, PROCEDURAL_SIMULATION, or PRESET)
5. `useWeatherData` effect watches `report?.location`
6. Weather APIs (`/api/weather`, `/api/weather/historical`) are called
7. Results update `currentWeather` and `historicalWeatherData` in context

### User adjusts policy slider

1. `PolicySensitivityPanel` slider onChange → `setPolicySensitivity(val)`
2. `usePolicySensitivity` effect watches `policySensitivity`
3. Calls `modulateReportWithSensitivity(report, policySensitivity)`
4. Returns `activeReport` (modulated version)
5. All components reading `activeReport` re-render

### User changes forecasting parameters

1. `ForecastingTab` updates param (e.g., `setArimaParams({ p: 3 })`)
2. `useForecastingModels` effect watches all params + `useRealHistory` + `historicalWeatherData`
3. Auto-runs `runActuarialForecast()`
4. Calls appropriate model function → updates `fittedData` in context
5. `ForecastingTab` re-renders with new results

### User clicks "Backtest"

1. `ForecastingTab` button onClick → `triggerModelBacktest()`
2. Sets `isTraining = true`, starts 200ms interval
3. Animates training progress (0→100) and logs
4. When progress reaches 100%, runs actual model
5. Updates `fittedData` and sets `isTraining = false`

### User selects specialist or horizon

1. `SpecialistBoard` button or `HorizonChart` element onClick → setter from `useUIState`
2. Updates `selectedSpecialist` or `selectedHorizonIndex` in context
3. `useUIState` computes new `currentProjection`
4. Components re-render to show selected data

### Error handling

1. Any hook catches error (API fail, etc.) → updates `error` in context
2. `ErrorDisplay` renders modal
3. User clicks "RE-ESTABLISH CONNECTION" → reloads page or clears error

---

## Changes & Removals

### Removed
- **PDF export functionality:** All references to `handleDownloadPDF`, `isExportingPDF`, PDF-related state removed
- **PDF-related DOM elements:** `pdf-capture-policy-chart`, `pdf-capture-predictive-chart` ids removed
- **jsPDF & html2canvas imports:** No longer needed
- **PDF export section in original App.tsx** (~500 lines of jsPDF code) deleted

### Kept
- **All stress-test features:** Address input, API calls, report rendering
- **All weather features:** Current & historical weather fetching
- **All forecasting models:** ARIMA, LSTM, CMIP ensemble
- **All UI visualizations:** Charts, specialist verdicts, policy sensitivity
- **Geographic overlay & social sentiment:** Unchanged, still imported and used
- **Existing type definitions:** `types.ts` unchanged

---

## Error Handling & Edge Cases

**API Failures:**
- `useStressTest`: Catch fetch error → set `error` in context → `ErrorDisplay` renders
- `useWeatherData`: Silently fail if weather APIs down; forecasting works without real data
- `useForecastingModels`: Wrap model calls in try-catch → if fail, keep previous `fittedData`

**Missing Data:**
- If `report` is null: render empty state placeholder in `SpecialistBoard`, `HorizonChart`
- If `currentProjection` is null: components guard against undefined access
- If `fittedData` is null: `ForecastingTab` shows "Run a forecast to see results"

**Weather Optional:**
- `useRealHistory` toggle allows users to disable real weather, force procedural simulation
- Forecasting always runs, uses synthetic fallback if real data unavailable

**Model Crashes:**
- Forecasting model functions wrapped in try-catch
- If model fails, `fittedData` stays null, training stops
- User sees last valid result or empty state

---

## Testing Strategy

### Unit Tests (Hooks)

- **`useStressTest`**
  - Test address input state updates
  - Test API call on form submit (mock fetch)
  - Test loading log animation (mock setInterval)
  - Test error handling on API failure

- **`useWeatherData`**
  - Test weather APIs called on location change
  - Test silent failure if APIs unavailable
  - Test `useRealHistory` toggle behavior

- **`useForecastingModels`**
  - Test parameter state updates
  - Test auto-run on param change
  - Test training animation loop
  - Test model function calls with correct inputs
  - Test interval cleanup on unmount

- **`usePolicySensitivity`**
  - Test modulation logic with various sensitivity values
  - Test `activeReport` updates when policy or raw report changes

- **`useUIState`**
  - Test horizon selection updates
  - Test specialist selection updates
  - Test `currentProjection` derived value

### Integration Tests (Components)

- **`Header`**: Test form submission calls `onSubmit` with address
- **`SpecialistBoard`**: Test specialist button clicks call `onSelectSpecialist`
- **`ForecastingTab`**: Test parameter changes, "Backtest" button, training animation
- **`PolicySensitivityPanel`**: Test slider onChange behavior
- **`App`**: Full flow: address → report → weather → forecast

### Context Integration

- Test that `AppStateProvider` distributes state correctly
- Test that state updates in one hook are visible to other hooks via context

---

## Implementation Order

1. Create `AppStateContext.tsx` + provider
2. Extract hooks one-by-one: `useStressTest` → `useWeatherData` → `useForecastingModels` → `usePolicySensitivity` → `useUIState`
3. Create sub-components: `Header`, `LoadingOverlay`, `ErrorDisplay`, `AlertBanners`, `PolicySensitivityPanel`, `SpecialistBoard`, `HorizonChart`, `ForecastingTab`
4. Refactor `App.tsx` to use context + hooks + sub-components
5. Remove all PDF-related code
6. Test and verify feature parity with original

---

## Success Criteria

- ✅ All existing features work (stress test, weather, forecasting, specialist verdicts, charts)
- ✅ No PDF export button or functionality
- ✅ State management centralized in context + hooks
- ✅ `App.tsx` is ~200 lines (down from ~2500)
- ✅ Each component is focused and ~50–300 lines
- ✅ Custom hooks are reusable and testable
- ✅ Data flows clearly through context
- ✅ Error handling works for all API calls
- ✅ No regression in UI/UX
