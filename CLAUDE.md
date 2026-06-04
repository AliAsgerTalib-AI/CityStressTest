# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CityStressTest is a climate and real estate risk assessment tool that evaluates the long-term viability of residential properties across 8 time horizons (5, 10, 15, 20, 25, 50, 75, and 100 years). It synthesizes analysis from 13 specialist perspectives (economists, engineers, environmental specialists, etc.) and provides detailed stress-test reports with projections for climate impacts, property values, insurance gaps, and municipal resilience.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Recharts (charting), D3 (geographic overlays)
- **Backend**: Express.js (Node.js), TypeScript
- **AI Integration**: Google Gemini API with fallback procedural simulation
- **Build/Deploy**: Vite + esbuild for bundling, tsx for development
- **Export**: html2canvas + jsPDF for PDF report generation

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs with tsx, includes live reload)
npm run dev

# Type checking
npm run lint

# Production build (builds frontend + bundles backend)
npm run build

# Run production bundle (after build)
npm run start

# Clean build artifacts
npm run clean
```

## Architecture

### Data Flow
1. User enters an address in the React UI
2. Frontend makes POST request to `/api/stress-test` with the address
3. Backend either:
   - Calls Google Gemini API with a detailed prompt asking for structured JSON analysis (if `VITE_GEMINI_API_KEY` is set)
   - Falls back to `generateProceduralReport()` for deterministic offline simulation
4. Backend returns `StressTestReport` (TypeScript `StressTestReport` interface in `src/types.ts`)
5. Frontend renders interactive visualizations with time-series charts, specialist verdicts, and regional metrics

### Core Files

**Backend**
- `server.ts` — Express app with `/api/stress-test` endpoint. Handles Gemini client initialization (lazy), prompt construction, and JSON parsing. Implements graceful fallback to procedural simulation.

**Frontend Main**
- `src/App.tsx` — Main React component. Handles address input, API calls, loading states, PDF export, chart interactions, and specialist verdict display.
- `src/types.ts` — TypeScript interfaces for `StressTestReport`, `HorizonProjection`, `Specialists`, `HorizonMetrics`, and related structures.

**Utilities**
- `src/utils/stressTestUtils.ts` — Procedural report generation (`generateProceduralReport()`), policy sensitivity modulation, and social sentiment analysis (`getSocialSentimentSpecialist()`). Used when Gemini API is unavailable.
- `src/utils/climateModels.ts` — Climate forecasting models: ARIMA, LSTM, and CMIP ensemble. Generates synthetic time-series data for temperature and precipitation trends.

**Components**
- `src/components/GeographicThreatOverlay.tsx` — D3-based geographic visualization showing climate hazard zones and vulnerability overlays.
- `src/components/SocialSentimentIndex.tsx` — Displays sentiment analysis of local communities with panic/optimism scores by horizon.

### Key Interfaces (from `src/types.ts`)

- `StressTestReport` — Top-level report object containing location, coordinates, baseline price, transition decade, and projections array.
- `HorizonProjection` — Single time-horizon analysis (e.g., 5-year, 25-year) with status, asset alpha, metrics, and 13 specialist verdicts.
- `Specialists` — Object with 13 specialist verdicts (e.g., `macroEconomist`, `structuralEngineer`, `zoningAttorney`).
- `HorizonMetrics` — Environmental/economic metrics for a horizon (cap rate, flood probability, wet-bulb temp, aquifer status, etc.).
- `SpecialistVerdict` — Enum verdict (`BULLISH`, `STABLE`, `WATCH`, `BEARISH`, `DIVEST`) + narrative string.

## Configuration & Environment

- **VITE_GEMINI_API_KEY** — Required for AI-powered report generation. If not set or placeholder, the app falls back to deterministic procedural simulation.
- **APP_URL** — Optional; used for self-referential links and OAuth callbacks in AI Studio deployments.
- **DISABLE_HMR** — Environment variable (used in AI Studio). When set to `"true"`, disables Vite HMR and file watching to reduce CPU during agent edits.

### Vite Configuration Notes
- React and Tailwind plugins are enabled.
- Path alias `@/*` points to the project root for relative imports.
- File watching is disabled when `DISABLE_HMR=true` (prevents flickering during rapid agent edits in AI Studio).

### TypeScript Configuration
- Target: `ES2022`
- Module: `ESNext`
- JSX: `react-jsx`
- Allow importing TypeScript extensions (for ESM interop).
- No emit; type checking only (`npm run lint`).

## Gemini API Prompt Structure

The backend sends a dense, multi-perspective prompt to Gemini that:
1. Defines 13 specialist roles (macro-economist, structural engineer, hydrogeologist, etc.).
2. Asks for analysis across 8 time horizons (5, 10, 15, 20, 25, 50, 75, 100 years).
3. Requests live Google Search grounding for factual accuracy.
4. Mandates a strict JSON output schema with specific fields (cap rates, flood probabilities, specialist verdicts, pricing projections, environmental baselines).
5. Emphasizes "brutal," "unsentimental" analysis tailored to the specific location.

Expected output is a `StressTestReport` JSON object. If Gemini parsing fails or the API is unavailable, the backend seamlessly falls back to procedural simulation.

## Testing & Verification

- **Type Checking**: `npm run lint` runs TypeScript compiler in check-only mode.
- **Manual Testing**: Start the dev server with `npm run dev` and test the UI by entering addresses and verifying:
  - Proper API calls to `/api/stress-test`
  - Correct rendering of charts (Recharts for timeline, D3 for geographic overlay)
  - PDF export functionality (using html2canvas + jsPDF)
  - Fallback behavior when `VITE_GEMINI_API_KEY` is missing
  - Specialist verdict display and social sentiment analysis

## Common Development Tasks

### Modifying the Specialist Verdicts or Metrics
1. Update the specialist definitions in the Gemini prompt (around line 71 of `server.ts`).
2. Update `Specialists` interface in `src/types.ts` if adding/removing specialists.
3. If adding procedural logic, update `getSocialSentimentSpecialist()` and other utility functions in `stressTestUtils.ts`.

### Adding a New Chart or Visualization
1. Add the React component in `src/components/`.
2. Import and render it in `src/App.tsx`.
3. Use Recharts for simple time-series; use D3 for complex geographic/spatial visualizations.
4. Ensure the component respects the `HorizonProjection` and `StressTestReport` data structures.

### Updating the Stress Test Report Schema
1. Modify the Gemini prompt in `server.ts` to reflect new fields.
2. Update `StressTestReport`, `HorizonProjection`, and related interfaces in `src/types.ts`.
3. Update the procedural generation logic in `src/utils/stressTestUtils.ts` to produce the new fields.
4. Update any display logic in `src/App.tsx` and components to render the new fields.

### Running Locally Without Gemini
Set `VITE_GEMINI_API_KEY` to an empty string or placeholder, and the app will use deterministic procedural simulation. This is useful for offline development and testing the UI without API costs.

## Build & Deployment Notes

- **Development**: `npm run dev` uses `tsx` to directly run `server.ts` with hot reload.
- **Production Build**: `npm run build` runs Vite to build the React frontend (`dist/`) and esbuild to bundle the server into a single CommonJS file (`dist/server.cjs`).
- **Start Production**: `npm start` runs the compiled server, which serves static frontend files and API endpoints.
- **AI Studio Deployment**: The app is compatible with Google AI Studio. It respects the `DISABLE_HMR` and `APP_URL` environment variables for that platform.

## Notes for Future Development

- The procedural simulation engine in `stressTestUtils.ts` is comprehensive enough to run the full UI independently; it's not a stub. This allows robust offline operation and testing.
- Climate forecast models (`climateModels.ts`) include ARIMA, LSTM, and CMIP ensemble approaches. They generate synthetic but plausible time-series data.
- The specialist verdict system is designed to be extendable. Adding a new specialist only requires updating the prompt, the `Specialists` interface, and the procedural fallback logic.
- PDF export uses html2canvas to capture the rendered DOM and jsPDF to bundle it. Test this feature when modifying the report layout.
