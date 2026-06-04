# Phase 1: Uncertainty & Failure Chain Analysis

**Date:** 2026-06-04  
**Status:** Design (Ready for Implementation)  
**Scope:** Property-level failure chain narratives and uncertainty transparency  
**Phase:** 1 of 2 (City/region layers deferred to Phase 2)

---

## Problem Statement

Users see specialist verdicts and metric values but lack:
1. **Causality**: Why does the property transition from STABLE ASSET to LIABILITY? What's the sequence of events?
2. **Confidence**: How much should they trust these projections? What's the uncertainty range?
3. **Data transparency**: Where did this data come from? Is it verified or estimated?

Current UI presents verdicts without explaining *why* they occur or *how certain* they are. Users can't distinguish between high-confidence projections (e.g., "USGS verified aquifer data") and speculative estimates (e.g., "regional market comps").

---

## Goals

By end of Phase 1:
- ✅ Every metric displays its failure chain narrative (why it changes)
- ✅ Every metric shows confidence level (HIGH/MEDIUM/LOW)
- ✅ Every metric shows uncertainty range (low/baseline/high scenario)
- ✅ Every metric includes data provenance (source + verification status)
- ✅ Users can understand what drives property risk over time
- ✅ Users can assess trustworthiness of projections

---

## Architecture

### Data Flow

```
User selects horizon (e.g., 25-Year)
    ↓
Frontend requests /api/stress-test with address
    ↓
Backend: Gemini prompt (expanded to include failure narratives + uncertainty)
    ↓
Gemini returns StressTestReport with MetricUncertainty data
    ↓
Frontend: AnalysisTab renders organized metrics with expandable narratives
    ↓
User clicks "Why this changes" → sees failure chain explanation
```

If Gemini API unavailable:
- Procedural `generateProceduralReport()` provides deterministic failure narratives
- Confidence levels set to LOW/MEDIUM conservatively
- Uncertainty ranges generated from hardcoded rules

### New Component Hierarchy

```
App.tsx
├─ TabSwitcher (added "Analysis" tab)
└─ AnalysisTab.tsx (NEW)
   ├─ HorizonSelector
   ├─ ViewToggle ("By Domain" / "By Confidence")
   └─ MetricGroupList
      └─ MetricGroup (e.g., ENVIRONMENTAL_METRICS)
         └─ MetricRow.tsx (NEW)
            ├─ MetricValue + ConfidenceBadge
            ├─ UncertaintyRange
            ├─ Provenance
            └─ ExpandableNarrative
```

---

## Data Model

### New Types (src/types.ts)

```typescript
export interface MetricProvenance {
  source: string;           // e.g. "USGS", "NOAA", "Climate model ensemble", "Regional comps"
  verified: boolean;        // true = from authoritative source; false = estimated/procedural
  uncertainty: string;      // e.g. "±2%", "±0.5°C", "±15%", "Unknown"
  verificationDate?: string; // e.g. "2024-03", ISO format if known
}

export interface MetricUncertainty {
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Three scenarios
  lowScenario: string;       // Worst-case projection
  baselineScenario: string;  // Current/expected scenario
  highScenario: string;      // Best-case projection
  
  // Why it matters
  failureChainNarrative: string; // 2-3 sentences explaining causal sequence
  provenance: MetricProvenance;
}

// Extended HorizonMetrics
export interface HorizonMetrics {
  // Environmental
  capRate: string;
  capRateUncertainty: MetricUncertainty;
  
  municipalDebt: string; // "STABLE", "GROWING", "CRITICAL", "DEFAULT"
  municipalDebtUncertainty: MetricUncertainty;
  
  foundationIntegrity: string; // e.g. "95%"
  foundationIntegrityUncertainty: MetricUncertainty;
  
  heatIndexDays: string; // e.g. "12 Days/Yr"
  heatIndexDaysUncertainty: MetricUncertainty;
  
  averageTemp: string; // e.g. "24°C"
  averageTempUncertainty: MetricUncertainty;
  
  wetBulbTemp: string; // e.g. "21°C"
  wetBulbTempUncertainty: MetricUncertainty;
  
  freshwaterStatus: string; // e.g. "SECURE", "TANK-IMPORTED"
  freshwaterStatusUncertainty: MetricUncertainty;
  
  localAquifer: string; // e.g. "SECURE", "SALINITY RISING"
  localAquiferUncertainty: MetricUncertainty;
  
  floodProb: string; // e.g. "12% decadal"
  floodProbUncertainty: MetricUncertainty;
  
  hardinessZone: string; // e.g. "10b -> 11a"
  hardinessZoneUncertainty: MetricUncertainty;
}
```

### Metric Grouping (Frontend Organization)

Metrics are grouped by domain for readability:

| Domain | Metrics |
|--------|---------|
| **Environmental** | Flood Probability, Wet-Bulb Temp, Heat Index Days, Average Temp, Hardiness Zone, Local Aquifer, Freshwater Status |
| **Economic** | Cap Rate, Municipal Debt |
| **Structural** | Foundation Integrity |

(This grouping is configurable; can be extended in future.)

---

## UI Design

### Analysis Tab Layout

**Header:**
- Horizon selector (5Y, 10Y, 15Y, ..., 100Y buttons)
- View toggle: "By Domain" / "By Confidence"
- Legend: 🟢 HIGH / 🟡 MEDIUM / 🔴 LOW confidence colors

**Main Content:**

Organized by domain (or confidence if toggled). Each metric shows:

```
▼ ENVIRONMENTAL METRICS (7 metrics)
  ├─ Flood Probability: 18% decadal
  │  ├ Confidence: 🟡 MEDIUM
  │  ├ Range: 12% (low) → 18% (base) → 26% (high)
  │  ├ Source: NOAA climate model ±4% uncertainty
  │  └ ▼ Why this changes:
  │    Aquifer depletion forces groundwater into coastal layer (2035),
  │    salinity rises, coastal subsidence accelerates. Combined with sea level
  │    rise (+18cm by 2060) and increased storm intensity from warming oceans.
  │
  ├─ Wet-Bulb Temp: 21.5°C
  │  ├ Confidence: 🟢 HIGH
  │  ├ Range: 20.8°C → 21.5°C → 23.2°C
  │  ├ Source: CMIP5 ensemble (verified, ±0.5°C)
  │  └ ▼ Why this changes: [expandable]
```

**Interaction:**
- Click "▼ Why this changes" → narrative expands in-place
- Click metric name → (optional) shows visual failure sequence diagram

---

## Backend Prompt Changes

Extend the Gemini API prompt in `server.ts`:

**New instruction block:**
```
For EACH metric in EACH horizon, provide:

1. Confidence level (HIGH/MEDIUM/LOW):
   - HIGH: Data from authoritative government/research source (USGS, NOAA, etc.)
           with peer-reviewed validation
   - MEDIUM: Mix of verified baseline data + climate/economic models, or sparse
             recent government data
   - LOW: Mostly procedural estimation, regional comps without direct data,
          or highly speculative models

2. Three-scenario projection (low/baseline/high):
   - Low: Conservative, assumes worst-case plausible conditions
   - Baseline: Expected outcome based on current trends
   - High: Optimistic, assumes adaptive policies or favorable conditions

3. Failure chain narrative (2-3 sentences):
   - Explain the *sequence* of events causing this metric to change
   - Reference specific tipping points (e.g., "aquifer salinity exceeds
     drinking water thresholds in 2038")
   - Be specific to the location

4. Provenance:
   - Data source (USGS, NOAA, regional assessor, etc.)
   - If estimated, explain the estimation method
   - Uncertainty margin (±X%)
```

---

## Procedural Fallback

When Gemini API unavailable, `stressTestUtils.ts` generates conservative uncertainty data:

**Example:** `getFloodProbabilityNarrative()`

```typescript
function getFloodProbabilityUncertainty(
  horizon: number,
  location: string,
  baselineFloodProb: string
): MetricUncertainty {
  const year = 2026 + horizon;
  const pctIncrease = Math.floor(horizon / 10) * 3; // 3% per decade
  
  return {
    confidenceLevel: 'LOW', // Procedural, not verified
    lowScenario: `${Math.max(2, Math.floor(parseFloat(baselineFloodProb) * 0.8))}% decadal`,
    baselineScenario: `${Math.floor(parseFloat(baselineFloodProb) * (1 + pctIncrease / 100))}% decadal`,
    highScenario: `${Math.floor(parseFloat(baselineFloodProb) * (1 + pctIncrease / 100) * 1.5)}% decadal`,
    failureChainNarrative:
      `Sea level rise and increased precipitation intensity increase flood probability. ` +
      `Exact trajectory depends on local drainage, aquifer status, and municipal ` +
      `flood mitigation investment (unknown).`,
    provenance: {
      source: 'Procedural simulation',
      verified: false,
      uncertainty: '±30%',
    },
  };
}
```

All procedural narratives are marked LOW confidence and use conservative ranges.

---

## Files to Create/Modify

### New Files
- `src/components/AnalysisTab.tsx` — Main analysis view
- `src/components/MetricRow.tsx` — Individual metric display with expandable narrative
- `src/components/MetricGroup.tsx` — Domain-grouped metrics container
- `docs/superpowers/specs/2026-06-04-phase1-uncertainty-failure-chains.md` (this file)

### Modified Files
- `src/types.ts` — Add `MetricUncertainty`, `MetricProvenance` interfaces; extend `HorizonMetrics`
- `src/App.tsx` — Add "Analysis" tab to tab switcher
- `server.ts` — Extend Gemini prompt with uncertainty/narrative requests
- `src/utils/stressTestUtils.ts` — Add procedural uncertainty generation for each metric

---

## Implementation Order

1. **Phase 1a:** Update `types.ts` with new interfaces
2. **Phase 1b:** Extend Gemini prompt in `server.ts`; add procedural uncertainty generation in `stressTestUtils.ts`
3. **Phase 1c:** Create `MetricRow.tsx`, `MetricGroup.tsx`, `AnalysisTab.tsx` components
4. **Phase 1d:** Wire "Analysis" tab into `App.tsx`
5. **Phase 1e:** Manual testing and refinement

---

## Testing & Verification

### Manual Testing
- [ ] Request stress test for sample address
- [ ] Confirm Analysis tab renders for all horizons
- [ ] Verify each metric shows confidence badge + range + provenance
- [ ] Click "Why this changes" → narrative expands
- [ ] Test fallback: disable Gemini API key, verify procedural narratives appear with LOW confidence
- [ ] Check that ranges make sense (low < baseline < high in most cases)

### Type Checking
- Run `npm run lint` — no TypeScript errors

### Browser Testing
- Test tab switching and horizon selection don't break
- Verify PDF export still works (if it includes Analysis tab, great; if not, that's Phase 2)

---

## Success Criteria

✅ All metrics have confidence levels visible  
✅ All metrics show 3-scenario uncertainty ranges  
✅ All metrics include data provenance  
✅ Failure chain narratives explain *why* metrics change  
✅ Users can distinguish HIGH/MEDIUM/LOW confidence data  
✅ Procedural fallback provides defensible, marked-as-uncertain data  
✅ Type checking passes  
✅ UI doesn't feel overwhelming (expandable narratives + domain grouping help)  

---

## Out of Scope (Phase 2+)

- City/neighborhood/region-level outlook
- Comparative property analysis
- Visual failure sequence diagrams (can add if users request)
- Municipal financial API integration
- Climate migration model integration
- Social fabric/political will quantification

---

## Notes

- All uncertainty data lives in the data model; UI just displays it. Easy to extend later.
- Failure narratives are location-specific from Gemini or deterministic from procedural logic. Both are transparent about their assumptions.
- LOW confidence metrics signal "this is an estimate" without discouraging user engagement. Phase 2 will add city-context data (e.g., municipal zoning, infrastructure investment trends) to improve confidence on some metrics.
- Ranges can be reversed in rare cases (e.g., property value might decrease in best-case scenario if municipal services improve but climate risk overwhelms). This is OK; ranges reflect plausible scenarios, not monotonic trends.
