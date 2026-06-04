# Phase 1: Uncertainty & Failure Chain Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add transparent uncertainty quantification, confidence badges, and failure chain narratives to each metric across all time horizons, enabling users to understand *why* projections change and *how certain* they are.

**Architecture:** Extend the data model to include `MetricUncertainty` (confidence, ranges, provenance, narrative) for each metric. Gemini prompt is expanded to generate this data. Procedural fallback generates conservative uncertainty estimates. New "Analysis" tab in the UI displays metrics organized by domain with expandable failure narratives and confidence badges.

**Tech Stack:** TypeScript interfaces, React components, Tailwind CSS, Gemini API prompt engineering

---

## File Structure

| File | Responsibility |
|------|-----------------|
| `src/types.ts` | Define `MetricUncertainty`, `MetricProvenance` interfaces; extend `HorizonMetrics` |
| `server.ts` | Expand Gemini prompt to request uncertainty/narrative data |
| `src/utils/stressTestUtils.ts` | Procedural uncertainty generation for all metrics |
| `src/components/MetricRow.tsx` | Display single metric: value, confidence badge, range, provenance, expandable narrative |
| `src/components/MetricGroup.tsx` | Container for metrics grouped by domain (Environmental, Economic, Structural) |
| `src/components/AnalysisTab.tsx` | Main tab component: horizon selector, view toggle, metric groups |
| `src/App.tsx` | Wire "Analysis" tab into tab switcher |

---

## Task 1: Update types.ts with MetricUncertainty and MetricProvenance

**Files:**
- Modify: `src/types.ts` (add new interfaces, extend `HorizonMetrics`)

- [ ] **Step 1: Add MetricProvenance interface**

Open `src/types.ts` and add these interfaces after the existing `SpecialistVerdict` interface (around line 9):

```typescript
export interface MetricProvenance {
  source: string;           // e.g. "USGS", "NOAA", "Climate model ensemble", "Regional comps"
  verified: boolean;        // true = authoritative source; false = estimated/procedural
  uncertainty: string;      // e.g. "±2%", "±0.5°C", "±15%"
  verificationDate?: string; // ISO format e.g. "2024-03"
}

export interface MetricUncertainty {
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lowScenario: string;       // Worst-case value
  baselineScenario: string;  // Expected value
  highScenario: string;      // Best-case value
  failureChainNarrative: string; // 2-3 sentences explaining why it changes
  provenance: MetricProvenance;
}
```

- [ ] **Step 2: Extend HorizonMetrics interface**

Find the `HorizonMetrics` interface (starts around line 11) and add uncertainty fields for each existing metric. Replace the entire interface with:

```typescript
export interface HorizonMetrics {
  // Environmental
  capRate: string;
  capRateUncertainty: MetricUncertainty;
  
  municipalDebt: string;
  municipalDebtUncertainty: MetricUncertainty;
  
  foundationIntegrity: string;
  foundationIntegrityUncertainty: MetricUncertainty;
  
  heatIndexDays: string;
  heatIndexDaysUncertainty: MetricUncertainty;
  
  averageTemp: string;
  averageTempUncertainty: MetricUncertainty;
  
  wetBulbTemp: string;
  wetBulbTempUncertainty: MetricUncertainty;
  
  freshwaterStatus: string;
  freshwaterStatusUncertainty: MetricUncertainty;
  
  localAquifer: string;
  localAquiferUncertainty: MetricUncertainty;
  
  floodProb: string;
  floodProbUncertainty: MetricUncertainty;
  
  hardinessZone: string;
  hardinessZoneUncertainty: MetricUncertainty;
}
```

- [ ] **Step 3: Run type check**

```bash
npm run lint
```

Expected: No TypeScript errors. If there are errors in other files due to the new interface fields, that's expected — we'll fix those in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: add MetricUncertainty and MetricProvenance types"
```

---

## Task 2: Extend Gemini Prompt in server.ts

**Files:**
- Modify: `server.ts` (extend the Gemini prompt)

- [ ] **Step 1: Locate the Gemini prompt in server.ts**

Open `server.ts`. Find the long prompt string that starts around line 60-70 with "You are an expert...". This is the prompt sent to Gemini.

- [ ] **Step 2: Add uncertainty request section to the prompt**

Find the section that says "Output format:" or "Expected output:" (around line 85-90). Before that section, add this new instruction block:

```typescript
For EACH metric in EACH horizon, provide confidence level, three-scenario projections, and failure chain narrative:

CONFIDENCE LEVELS (choose one for each metric):
- HIGH: Data from authoritative government/research source (USGS, NOAA, IPCC, etc.) with peer-reviewed validation or recent official surveys
- MEDIUM: Mix of verified baseline data + climate/economic models; or sparse recent government data with regional estimates
- LOW: Mostly procedural estimation, regional comps without direct data, or highly speculative models

THREE-SCENARIO PROJECTIONS (for each metric):
- lowScenario: Conservative worst-case plausible value (e.g., "8% decadal" for flood probability)
- baselineScenario: Expected outcome based on current trends (matches the metric value you report)
- highScenario: Optimistic best-case plausible value (e.g., "18% decadal")

FAILURE CHAIN NARRATIVES (2-3 sentences for each metric):
- Explain the SEQUENCE of physical/economic/social events causing this metric to change
- Reference specific tipping points with years (e.g., "aquifer salinity exceeds 4000 ppm in 2038, triggering insurance withdrawal by 2040")
- Be specific to the location; avoid generic statements
- Example: "Aquifer depletion forces freshwater into coastal layer. Saltwater intrusion accelerates because sea level rise (+18cm by 2060) reduces freshwater pressure. By 2045, well salinity exceeds 2500 ppm threshold."

DATA PROVENANCE (for each metric):
- source: Name the data source (e.g., "USGS groundwater database", "NOAA climate model", "Regional tax assessor")
- verified: true if from authoritative source; false if estimated/procedural
- uncertainty: Margin of error (e.g., "±2%", "±0.5°C", "±15%", "Unknown")
```

- [ ] **Step 3: Update the JSON output schema in the prompt**

Find the section that defines the response structure (look for `"metrics"` or `"capRate"`). Update the `HorizonMetrics` schema to include uncertainty fields. Find the existing metrics definition and replace it with:

```typescript
metrics: {
  capRate: "4.2%",
  capRateUncertainty: {
    confidenceLevel: "MEDIUM",
    lowScenario: "3.8%",
    baselineScenario: "4.2%",
    highScenario: "5.1%",
    failureChainNarrative: "Cap rates rise as insurance costs increase and climate risk reduces demand...",
    provenance: { source: "Regional comps", verified: false, uncertainty: "±0.5%", verificationDate: "2024-06" }
  },
  municipalDebt: "GROWING",
  municipalDebtUncertainty: {
    confidenceLevel: "HIGH",
    lowScenario: "GROWING",
    baselineScenario: "GROWING",
    highScenario: "CRITICAL",
    failureChainNarrative: "Municipal debt grows as infrastructure repair costs rise...",
    provenance: { source: "GFOA bond audit", verified: true, uncertainty: "±5%", verificationDate: "2024-05" }
  },
  // ... repeat for all metrics
  floodProb: "12% decadal",
  floodProbUncertainty: {
    confidenceLevel: "HIGH",
    lowScenario: "8% decadal",
    baselineScenario: "12% decadal",
    highScenario: "18% decadal",
    failureChainNarrative: "Flood probability increases due to sea level rise and increased storm intensity...",
    provenance: { source: "NOAA climate model", verified: true, uncertainty: "±4%", verificationDate: "2024" }
  }
}
```

- [ ] **Step 4: Run type check**

```bash
npm run lint
```

Expected: No new errors (existing Gemini response type mismatch is OK for now; we'll address in Task 3).

- [ ] **Step 5: Commit**

```bash
git add server.ts
git commit -m "feat: extend Gemini prompt to request uncertainty narratives and confidence levels"
```

---

## Task 3: Add Procedural Uncertainty Generation in stressTestUtils.ts

**Files:**
- Modify: `src/utils/stressTestUtils.ts`

- [ ] **Step 1: Add helper function for creating uncertainty objects**

Open `src/utils/stressTestUtils.ts`. At the top (after imports), add these helper functions:

```typescript
import { MetricUncertainty, MetricProvenance } from '../types';

// Helper to create LOW-confidence procedural uncertainty
function createProceduralUncertainty(
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string = 'Procedural simulation'
): MetricUncertainty {
  return {
    confidenceLevel: 'LOW',
    lowScenario: lowValue,
    baselineScenario: baselineValue,
    highScenario: highValue,
    failureChainNarrative: narrative,
    provenance: {
      source,
      verified: false,
      uncertainty: '±20%',
    },
  };
}

// Helper for MEDIUM confidence (mix of data + model)
function createMixedUncertainty(
  baselineValue: string,
  lowValue: string,
  highValue: string,
  narrative: string,
  source: string,
  uncertainty: string = '±10%'
): MetricUncertainty {
  return {
    confidenceLevel: 'MEDIUM',
    lowScenario: lowValue,
    baselineScenario: baselineValue,
    highScenario: highValue,
    failureChainNarrative: narrative,
    provenance: {
      source,
      verified: false,
      uncertainty,
    },
  };
}
```

- [ ] **Step 2: Add uncertainty generation for each metric**

Find the `generateProceduralReport()` function. Inside the loop where metrics are generated for each horizon, add uncertainty data for each metric. For example, in the metrics object for each horizon, add:

```typescript
// In the HorizonMetrics object for each horizon:

capRateUncertainty: createProceduralUncertainty(
  capRateValue,
  `${(parseFloat(capRateValue) * 0.85).toFixed(1)}%`,
  `${(parseFloat(capRateValue) * 1.1).toFixed(1)}%`,
  `Cap rates adjust based on market risk perception and climate insurance costs. ` +
  `If municipal services remain stable, rates stabilize; if infrastructure fails, rates rise sharply.`
),

municipalDebtUncertainty: createProceduralUncertainty(
  municipalDebtStatus,
  municipalDebtStatus, // Low scenario same as baseline
  'CRITICAL', // High scenario worse
  `Municipal debt grows as climate adaptation and infrastructure repair costs accumulate. ` +
  `Fiscal pressure increases if property tax base shrinks due to out-migration or devaluation.`
),

foundationIntegrityUncertainty: createProceduralUncertainty(
  foundationIntegrity,
  `${Math.max(5, parseFloat(foundationIntegrity) - 10)}%`,
  `${Math.min(100, parseFloat(foundationIntegrity) + 5)}%`,
  `Foundation integrity depends on soil stability and water table fluctuation. ` +
  `Saltwater intrusion and subsidence accelerate degradation; proper drainage slows it.`
),

heatIndexDaysUncertainty: createProceduralUncertainty(
  heatIndexDaysStr,
  `${Math.floor(heatIndexDays * 0.7)} Days/Yr`, // Low scenario: fewer heat days
  `${Math.floor(heatIndexDays * 1.4)} Days/Yr`, // High scenario: more heat days
  `Heat index days increase as global temperatures rise and urban heat island effects intensify. ` +
  `Local cooling strategies (vegetation, reflective surfaces) can reduce this; paved sprawl accelerates it.`
),

averageTempUncertainty: createProceduralUncertainty(
  avgTemp,
  `${(tempC - 0.5).toFixed(1)}°C`,
  `${(tempC + 1.2).toFixed(1)}°C`,
  `Average temperature rises as atmospheric CO2 accumulates. Exact warming rate depends on global emissions and regional climate feedback loops.`
),

wetBulbTempUncertainty: createProceduralUncertainty(
  wetBulbTempStr,
  `${(wetBulbC - 0.3).toFixed(1)}°C`,
  `${(wetBulbC + 0.8).toFixed(1)}°C`,
  `Wet-bulb temperature (perceived temperature and humidity combined) increases, making outdoor work and recreation dangerous at high values. ` +
  `Thresholds above 32°C become lethal for sustained exertion; above 35°C are dangerous for anyone.`
),

freshwaterStatusUncertainty: createProceduralUncertainty(
  freshwaterStatus,
  freshwaterStatus, // Low scenario same as baseline
  freshwaterStatus === 'SECURE' ? 'TANK-IMPORTED' : 'CRITICAL',
  `Freshwater availability depends on aquifer recharge rates and regional groundwater competition. ` +
  `Drought, population growth, and sea level rise all reduce available freshwater; conservation policies can extend supply.`
),

localAquiferUncertainty: createProceduralUncertainty(
  localAquifer,
  localAquifer,
  localAquifer === 'SECURE' ? 'SALINITY RISING' : 'CONTAMINATED',
  `Aquifer salinity rises as sea level rises and coastal groundwater is pulled inland. ` +
  `Inland aquifers face contamination from agricultural runoff and industrial activity. Salinity exceeding 2500 ppm triggers well abandonment.`
),

floodProbUncertainty: createProceduralUncertainty(
  floodProb,
  `${Math.max(1, Math.floor(floodProbNum * 0.6))}% decadal`,
  `${Math.floor(floodProbNum * 1.8)}% decadal`,
  `Flood probability increases with sea level rise (+${horizon / 20}cm by ${2026 + horizon}) and intensified storm rainfall. ` +
  `Compound events (high tide + storm surge + rainfall) become more likely. Coastal protection investments can reduce this risk locally.`
),

hardinessZoneUncertainty: createProceduralUncertainty(
  hardinessZone,
  hardinessZone, // Low scenario same
  hardinessZone, // High scenario same (zone shifts are gradual)
  `USDA hardiness zones shift as temperature increases. Zones move approximately 100 miles north per 1°C warming. ` +
  `This affects which plants/trees survive; species adapted to cooler zones may fail.`
),
```

- [ ] **Step 3: Run type check**

```bash
npm run lint
```

Expected: No new errors in stressTestUtils.ts.

- [ ] **Step 4: Commit**

```bash
git add src/utils/stressTestUtils.ts
git commit -m "feat: add procedural uncertainty generation for all metrics"
```

---

## Task 4: Create MetricRow.tsx Component

**Files:**
- Create: `src/components/MetricRow.tsx`

- [ ] **Step 1: Create the MetricRow component**

Create a new file `src/components/MetricRow.tsx` with this content:

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MetricUncertainty } from '../types';

interface MetricRowProps {
  metricName: string;
  metricValue: string;
  uncertainty: MetricUncertainty;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  metricName,
  metricValue,
  uncertainty,
}) => {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor = {
    HIGH: 'bg-green-900 text-green-100',
    MEDIUM: 'bg-yellow-900 text-yellow-100',
    LOW: 'bg-red-900 text-red-100',
  }[uncertainty.confidenceLevel];

  const confidenceEmoji = {
    HIGH: '🟢',
    MEDIUM: '🟡',
    LOW: '🔴',
  }[uncertainty.confidenceLevel];

  return (
    <div className="border-l-2 border-border-dark pl-4 py-3">
      {/* Metric header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-mono text-sm text-[#e5e5e5]">
            {metricName}: <span className="font-bold text-accent-gold">{metricValue}</span>
          </div>
        </div>
      </div>

      {/* Confidence badge + metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <span className={`px-2 py-1 rounded ${confidenceColor} font-mono`}>
          {confidenceEmoji} {uncertainty.confidenceLevel}
        </span>
        
        <span className="text-[#999]">
          Range: <span className="text-[#ccc]">{uncertainty.lowScenario}</span>
          {' → '}
          <span className="text-accent-gold">{uncertainty.baselineScenario}</span>
          {' → '}
          <span className="text-[#ccc]">{uncertainty.highScenario}</span>
        </span>
      </div>

      {/* Provenance */}
      <div className="mt-2 text-xs text-[#999]">
        <span className="text-[#ccc]">Source:</span> {uncertainty.provenance.source}
        {uncertainty.provenance.verificationDate && ` (${uncertainty.provenance.verificationDate})`}
        {uncertainty.provenance.uncertainty !== 'Unknown' && ` ±${uncertainty.provenance.uncertainty}`}
        {uncertainty.provenance.verified && ' ✓'}
      </div>

      {/* Expandable narrative */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs font-mono text-accent-gold hover:text-accent-gold/80 cursor-pointer flex items-center gap-1"
      >
        <span>{expanded ? '▼' : '▶'}</span> Why this changes
      </button>

      {expanded && (
        <div className="mt-2 text-xs text-[#ccc] leading-relaxed bg-surface-dark p-2 rounded border border-border-dark">
          {uncertainty.failureChainNarrative}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run type check**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MetricRow.tsx
git commit -m "feat: create MetricRow component for uncertainty display"
```

---

## Task 5: Create MetricGroup.tsx Component

**Files:**
- Create: `src/components/MetricGroup.tsx`

- [ ] **Step 1: Create the MetricGroup component**

Create a new file `src/components/MetricGroup.tsx` with this content:

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { MetricRow } from './MetricRow';
import { HorizonMetrics } from '../types';

interface Metric {
  name: string;
  key: keyof HorizonMetrics;
  uncertaintyKey: keyof HorizonMetrics;
}

interface MetricGroupProps {
  groupName: string;
  metrics: Metric[];
  horizonMetrics: HorizonMetrics;
}

export const MetricGroup: React.FC<MetricGroupProps> = ({
  groupName,
  metrics,
  horizonMetrics,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border-dark rounded p-4 bg-surface-dark mb-4">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between cursor-pointer hover:bg-surface-light/5 p-2 -m-2"
      >
        <h3 className="font-mono text-sm font-bold text-accent-gold uppercase tracking-wider">
          {expanded ? '▼' : '▶'} {groupName} <span className="text-[#999] font-normal">({metrics.length} metrics)</span>
        </h3>
      </button>

      {/* Metrics list */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {metrics.map((metric) => {
            const value = horizonMetrics[metric.key];
            const uncertainty = horizonMetrics[metric.uncertaintyKey];

            // Skip if uncertainty data is missing (shouldn't happen, but defensive)
            if (!uncertainty || typeof uncertainty !== 'object') {
              return null;
            }

            return (
              <MetricRow
                key={metric.key}
                metricName={metric.name}
                metricValue={String(value)}
                uncertainty={uncertainty as any}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Run type check**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MetricGroup.tsx
git commit -m "feat: create MetricGroup component for organizing metrics by domain"
```

---

## Task 6: Create AnalysisTab.tsx Component

**Files:**
- Create: `src/components/AnalysisTab.tsx`

- [ ] **Step 1: Create the AnalysisTab component**

Create a new file `src/components/AnalysisTab.tsx` with this content:

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { StressTestReport, HorizonProjection, HorizonMetrics } from '../types';
import { MetricGroup } from './MetricGroup';

interface AnalysisTabProps {
  activeReport: StressTestReport;
  currentProjection: HorizonProjection;
  onSelectHorizon: (horizon: number) => void;
}

type ViewMode = 'domain' | 'confidence';

const METRIC_GROUPS = [
  {
    name: 'ENVIRONMENTAL METRICS',
    metrics: [
      { name: 'Flood Probability', key: 'floodProb' as const, uncertaintyKey: 'floodProbUncertainty' as const },
      { name: 'Wet-Bulb Temperature', key: 'wetBulbTemp' as const, uncertaintyKey: 'wetBulbTempUncertainty' as const },
      { name: 'Heat Index Days', key: 'heatIndexDays' as const, uncertaintyKey: 'heatIndexDaysUncertainty' as const },
      { name: 'Average Temperature', key: 'averageTemp' as const, uncertaintyKey: 'averageTempUncertainty' as const },
      { name: 'Hardiness Zone', key: 'hardinessZone' as const, uncertaintyKey: 'hardinessZoneUncertainty' as const },
      { name: 'Local Aquifer', key: 'localAquifer' as const, uncertaintyKey: 'localAquiferUncertainty' as const },
      { name: 'Freshwater Status', key: 'freshwaterStatus' as const, uncertaintyKey: 'freshwaterStatusUncertainty' as const },
    ],
  },
  {
    name: 'ECONOMIC METRICS',
    metrics: [
      { name: 'Cap Rate', key: 'capRate' as const, uncertaintyKey: 'capRateUncertainty' as const },
      { name: 'Municipal Debt', key: 'municipalDebt' as const, uncertaintyKey: 'municipalDebtUncertainty' as const },
    ],
  },
  {
    name: 'STRUCTURAL METRICS',
    metrics: [
      { name: 'Foundation Integrity', key: 'foundationIntegrity' as const, uncertaintyKey: 'foundationIntegrityUncertainty' as const },
    ],
  },
];

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  activeReport,
  currentProjection,
  onSelectHorizon,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('domain');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-border-dark pb-4">
        <h2 className="font-mono text-lg font-bold text-accent-gold uppercase tracking-wider mb-4">
          Uncertainty & Failure Analysis
        </h2>

        {/* Horizon selector */}
        <div className="flex gap-2 flex-wrap mb-4">
          {activeReport.projections.map((proj) => (
            <button
              key={proj.horizon}
              onClick={() => onSelectHorizon(proj.horizon)}
              className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
                proj.horizon === currentProjection.horizon
                  ? 'bg-accent-gold text-black font-bold'
                  : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
              }`}
            >
              {proj.horizon}Y
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('domain')}
            className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
              viewMode === 'domain'
                ? 'bg-accent-gold text-black font-bold'
                : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
            }`}
          >
            View by Domain
          </button>
          <button
            onClick={() => setViewMode('confidence')}
            className={`px-3 py-2 font-mono text-xs uppercase rounded transition-all ${
              viewMode === 'confidence'
                ? 'bg-accent-gold text-black font-bold'
                : 'bg-surface-light text-[#e5e5e5] hover:bg-surface-light/80'
            }`}
          >
            View by Confidence
          </button>
        </div>

        {/* Legend */}
        <div className="mt-3 text-xs text-[#999] flex gap-4">
          <span>🟢 HIGH - Authoritative source</span>
          <span>🟡 MEDIUM - Mixed data</span>
          <span>🔴 LOW - Estimated</span>
        </div>
      </div>

      {/* Metrics content */}
      <div>
        {viewMode === 'domain' && (
          <div>
            {METRIC_GROUPS.map((group) => (
              <MetricGroup
                key={group.name}
                groupName={group.name}
                metrics={group.metrics}
                horizonMetrics={currentProjection.metrics}
              />
            ))}
          </div>
        )}

        {viewMode === 'confidence' && (
          <div>
            {['HIGH', 'MEDIUM', 'LOW'].map((confidenceLevel) => {
              const metricsWithConfidence = METRIC_GROUPS.flatMap((group) =>
                group.metrics.filter((metric) => {
                  const uncertainty = currentProjection.metrics[metric.uncertaintyKey];
                  return uncertainty && (uncertainty as any).confidenceLevel === confidenceLevel;
                })
              );

              if (metricsWithConfidence.length === 0) return null;

              return (
                <MetricGroup
                  key={confidenceLevel}
                  groupName={`${confidenceLevel} CONFIDENCE METRICS`}
                  metrics={metricsWithConfidence}
                  horizonMetrics={currentProjection.metrics}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Run type check**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AnalysisTab.tsx
git commit -m "feat: create AnalysisTab component for uncertainty visualization"
```

---

## Task 7: Wire Analysis Tab into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import AnalysisTab**

Open `src/App.tsx`. Find the imports at the top and add:

```typescript
import { AnalysisTab } from './components/AnalysisTab';
```

- [ ] **Step 2: Add Analysis tab to tab switcher**

Find the tab switcher section (around line 96-130). You'll see buttons like:

```typescript
<button
  onClick={() => ui.setActiveTab('readouts')}
  className={...}
>
  READOUTS
</button>
```

Add a third tab button after the "forecasting" button:

```typescript
<button
  onClick={() => ui.setActiveTab('analysis')}
  className={`flex-1 py-3 px-4 font-mono text-[11px] uppercase tracking-wider font-extrabold transition-all border cursor-pointer select-none flex items-center justify-center gap-2 ${
    ui.activeTab === 'analysis'
      ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
      : 'border-border-dark hover:border-accent-gold/50'
  }`}
>
  ANALYSIS
</button>
```

- [ ] **Step 3: Add Analysis tab content**

Find the section that renders tab content (look for `{ui.activeTab === 'readouts' && ...}`). Add this new condition alongside the existing ones:

```typescript
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
```

- [ ] **Step 4: Run type check**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 5: Test in browser**

```bash
npm run dev
```

Open the app in a browser. You should see the "ANALYSIS" tab next to "READOUTS" and "FORECASTING". Click it and verify:
- Horizon selector appears
- View toggle works
- Metric groups render
- Confidence badges are visible
- "Why this changes" button expands/collapses

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire Analysis tab into App.tsx"
```

---

## Task 8: Manual Testing and Verification

**Files:**
- Test in browser (no code changes)

- [ ] **Step 1: Test with Gemini API enabled**

Ensure `VITE_GEMINI_API_KEY` is set to your Gemini API key. Run:

```bash
npm run dev
```

Enter a test address (e.g., "San Francisco, CA"). Verify:
- Report loads successfully
- Analysis tab appears and is clickable
- All 3 metric groups render (Environmental, Economic, Structural)
- Each metric shows: value, confidence badge (🟢/🟡/🔴), range, source, and "Why this changes" button
- Clicking "Why this changes" expands/collapses the failure narrative
- Switching horizons updates metrics

Expected: All metrics have real uncertainty data from Gemini (should be mostly HIGH/MEDIUM confidence since Gemini uses real sources).

- [ ] **Step 2: Test with Gemini API disabled**

Unset `VITE_GEMINI_API_KEY` or set it to empty string:

```bash
unset VITE_GEMINI_API_KEY  # On macOS/Linux
# Or on Windows:
# $env:VITE_GEMINI_API_KEY = ""
```

Restart dev server:

```bash
npm run dev
```

Enter the same address. Verify:
- Report still loads (uses procedural fallback)
- Analysis tab still appears
- All metrics show uncertainty data
- Confidence badges are mostly 🔴 (LOW) and some 🟡 (MEDIUM) since procedural
- Failure narratives are generic but defensible ("depends on local drainage...")
- Ranges reflect conservative uncertainty

Expected: Procedural data displays with LOW confidence, clearly signaling estimation.

- [ ] **Step 3: Test "View by Confidence" toggle**

In the Analysis tab, click "View by Confidence". Verify:
- Metrics are now grouped by confidence level (HIGH, MEDIUM, LOW)
- Switching back to "View by Domain" works correctly
- No metrics are duplicated

Expected: Confidence grouping works smoothly.

- [ ] **Step 4: Run type check**

```bash
npm run lint
```

Expected: No TypeScript errors.

- [ ] **Step 5: Verify no regressions**

- Click "READOUTS" and "FORECASTING" tabs. Verify they still work.
- Test PDF export (if implemented). Verify it doesn't crash.
- Test multiple addresses. Verify Analysis tab updates correctly.

Expected: No breakage to existing functionality.

- [ ] **Step 6: Final commit**

If all tests pass, create a summary commit:

```bash
git add .
git commit -m "feat: complete Phase 1 uncertainty and failure chain analysis

- Add MetricUncertainty and MetricProvenance types
- Extend HorizonMetrics with uncertainty data for all metrics
- Expand Gemini prompt to request confidence, ranges, and narratives
- Add procedural uncertainty generation fallback
- Create MetricRow, MetricGroup, and AnalysisTab components
- Wire Analysis tab into main UI
- All metrics now display confidence badges, uncertainty ranges, and failure chain narratives
- Tested with both Gemini API and procedural fallback"
```
