# Real API Integration for Geographic Signals

**Date:** 2026-06-04  
**Status:** Design (Ready for Implementation)  
**Scope:** Replace mock geographic signals with real free API data  
**Phase:** 2.1 (Phase 2 extension)

---

## Problem Statement

Phase 2 added geographic context (city/region scales) with 60 signals across 5 categories. Currently all data is **procedural/mock** — deterministic simulation with no real grounding.

Goal: Replace with **real API data from free public sources** (Census Bureau, OpenStreetMap, USGS) while maintaining graceful degradation and offline operation.

**Constraints:**
- No paid APIs
- No costs
- Persistent cache (48 hours)
- Strict real-data-only (skip categories without real data sources, don't mix with procedural fallbacks)

---

## Goals

By end of this phase:
- ✅ Economic Viability signals pull from Census API (median income, poverty rate, unemployment)
- ✅ Demographic Trends signals pull from Census API (population, age, education, migration)
- ✅ Infrastructure Resilience signals pull from OpenStreetMap + USGS (broadband, utility data)
- ✅ City + region scales populated with real data
- ✅ Neighborhood scale removed (Census data not available at census-tract level for free APIs)
- ✅ Climate Migration and Social Fabric categories dropped (no free data sources)
- ✅ 48-hour persistent cache in localStorage
- ✅ Graceful fallback: "no real data available" instead of procedural data
- ✅ API failures don't block report generation

---

## Architecture

### Data Flow

```
User enters address & requests stress test
    ↓
Backend geocodes → extract city + state
    ↓
Frontend loads report with geographic context
    ↓
Frontend checks localStorage cache:
  - Cache hit + not expired? → use cached data
  - Cache miss or expired? → call /api/geographic-context/<city>/<state>
    ↓
Backend /api/geographic-context/:
  - Check in-memory ApiCacheManager
  - If miss: call ApiProviders (Census, OSM, USGS)
  - Return GeographicContext { city, region }
    ↓
Frontend stores result in localStorage (48h TTL)
    ↓
AnalysisTab renders geographic sections with real data
(or "no data available" if API failed, not procedural)
```

### Caching Strategy

**Server-side (in-memory):**
- ApiCacheManager: brief cache to prevent duplicate API calls within same session
- TTL: 5-10 minutes (optimization only; optional)

**Client-side (localStorage):**
- Key: `geographicCache_<city>_<state>` (e.g., `geographicCache_SanFrancisco_CA`)
- Value: `{ data: GeographicContext, expiresAt: timestamp }`
- TTL: 48 hours
- Persistent across page reloads, browser restarts

**Fallback Logic:**
- If API fails: don't cache; next request will retry
- If cache corrupted: treat as cache miss, fetch from API
- If localStorage full: ignore caching, continue without it

### API Sources

| Category | Signals | Source | Coverage |
|----------|---------|--------|----------|
| **Economic Viability** | Median household income, poverty rate, unemployment rate | Census Bureau ACS API | City + state (good coverage) |
| **Demographic Trends** | Population, age distribution, education level, net migration rate | Census Bureau ACS API | City + state (good coverage) |
| **Infrastructure Resilience** | Broadband availability, utility system age | OpenStreetMap (Overpass), USGS Open Data | Varies by city (spotty) |

**Dropped Categories:**
- **Climate Migration** — No free API for refugee projections; only research papers
- **Social Fabric** — No free APIs for civic participation, sentiment, political alignment
- **Neighborhood scale** — Census ACS data only available at city/county aggregation

---

## Data Model

### Changes to types.ts

**Remove neighborhood from GeographicContext:**
```typescript
export interface GeographicContext {
  city: GeographicScaleContext;      // City-level Census data + OSM data
  region: GeographicScaleContext;    // State-level Census data + OSM data
  // neighborhood removed
}
```

**Update GeographicScaleContext to reflect real-data categories:**
```typescript
export interface GeographicScaleContext {
  scale: 'city' | 'region';
  location: string;  // e.g., "San Francisco", "California"

  economicViability: {
    medianHouseholdIncome: GeographicSignal;
    povertyRate: GeographicSignal;
    unemploymentRate: GeographicSignal;
  };

  demographicTrends: {
    population: GeographicSignal;
    ageDistribution: GeographicSignal;
    educationLevel: GeographicSignal;
    netMigrationRate: GeographicSignal;
  };

  infrastructureResilience: {
    broadbandAvailability: GeographicSignal;
    utilitySystemAge: GeographicSignal;
    // May be null/missing if API unavailable for this location
  };
}
```

---

## New Components

### Server-side

**File: `src/utils/ApiCacheManager.ts`**
```typescript
export class ApiCacheManager {
  private cache: Map<string, { data: GeographicContext; expiresAt: number }> = new Map();

  get(key: string): GeographicContext | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: GeographicContext, ttlMinutes: number = 10) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    });
  }

  private isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
  }
}

export const apiCacheManager = new ApiCacheManager();
```

**File: `src/utils/providers/EconomicViabilityProvider.ts`**
```typescript
export class EconomicViabilityProvider {
  async fetchCity(city: string, state: string): Promise<GeographicScaleContext | null> {
    // Call Census Bureau ACS API
    // Map response to:
    // {
    //   scale: 'city',
    //   location: city,
    //   economicViability: {
    //     medianHouseholdIncome: { value, uncertainty, ... },
    //     povertyRate: { value, uncertainty, ... },
    //     unemploymentRate: { value, uncertainty, ... }
    //   },
    //   demographicTrends: { ... }, // empty, populated by DemographicTrendsProvider
    //   infrastructureResilience: { ... } // empty, populated by InfrastructureResilienceProvider
    // }
    // Returns null on API failure
  }

  async fetchRegion(state: string): Promise<GeographicScaleContext | null> {
    // Similar to fetchCity but for state-level Census data
  }
}
```

**File: `src/utils/providers/DemographicTrendsProvider.ts`**
Similar structure to EconomicViabilityProvider.

**File: `src/utils/providers/InfrastructureResilienceProvider.ts`**
Calls OpenStreetMap Overpass API + USGS Open Data. May return partial results (e.g., broadband available but utility age not).

### Server Endpoint

**New: `GET /api/geographic-context/:city/:state`**
```typescript
router.get('/api/geographic-context/:city/:state', async (req, res) => {
  const { city, state } = req.params;
  const cacheKey = `${city}_${state}`;

  // Check in-memory cache
  let cached = apiCacheManager.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Call all providers in parallel
    const [econ, demo, infra] = await Promise.all([
      economicViabilityProvider.fetchCity(city, state),
      demographicTrendsProvider.fetchCity(city, state),
      infrastructureResilienceProvider.fetchCity(city, state),
    ]);

    // Merge results
    const geographicContext = mergeProviderResults({ econ, demo, infra });

    // Cache result
    apiCacheManager.set(cacheKey, geographicContext);

    res.json(geographicContext);
  } catch (error) {
    res.status(500).json({ error: 'Geographic data unavailable' });
  }
});
```

### Frontend

**File: `src/hooks/useGeographicCache.ts`**
```typescript
export function useGeographicCache(city: string, state: string) {
  const [data, setData] = useState<GeographicContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage first
    const cacheKey = `geographicCache_${city}_${state}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data: cachedData, expiresAt } = JSON.parse(cached);
      if (Date.now() < expiresAt) {
        setData(cachedData);
        return;
      }
      localStorage.removeItem(cacheKey);
    }

    // Cache miss: fetch from API
    setLoading(true);
    fetch(`/api/geographic-context/${city}/${state}`)
      .then(r => r.json())
      .then(result => {
        // Store in localStorage with 48h expiry
        const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, expiresAt }));
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError('Real data unavailable for this location');
      })
      .finally(() => setLoading(false));
  }, [city, state]);

  return { data, loading, error };
}
```

---

## UI Changes

### AnalysisTab

**Remove:**
- Entire "Neighborhood" section
- Procedural fallback for unavailable categories

**Keep:**
- "City" and "Region" sections

**Update each section:**
```
📍 CITY: San Francisco, CA

✓ ECONOMIC VIABILITY (Real Census data)
  • Median Household Income: $95,000
  • Poverty Rate: 11%
  • Unemployment Rate: 3.2%

✓ DEMOGRAPHIC TRENDS (Real Census data)
  • Population: 873,965
  • Age Distribution: 38 median years
  • Education Level: 58% bachelor's degree or higher
  • Net Migration Rate: +2.1% annually

⚠ INFRASTRUCTURE RESILIENCE (Data unavailable)
  Could not retrieve broadband/utility data from public sources for this location.

---

📍 REGION: California

[Similar structure for region]
```

**Data Quality Badge:**
Each scale shows: "📌 Real Census Bureau data" or "❌ No real data available"

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| API timeout (>5s) | Fail gracefully; don't cache; show "data unavailable" |
| Network error | Fail gracefully; don't block report generation |
| Partial failure (1 category succeeds, 1 fails) | Show available categories; skip failed ones |
| Entire API call fails | Skip geographic context; report still renders with property metrics |
| localStorage corrupted | Treat as cache miss; fetch from API |
| localStorage full | Skip caching; continue without it |
| User clears localStorage | Next call fetches from API; repopulates cache |

---

## Files to Create/Modify

### New Files
- `src/utils/ApiCacheManager.ts`
- `src/utils/providers/EconomicViabilityProvider.ts`
- `src/utils/providers/DemographicTrendsProvider.ts`
- `src/utils/providers/InfrastructureResilienceProvider.ts`
- `src/hooks/useGeographicCache.ts`
- `docs/superpowers/specs/2026-06-04-real-api-integration-design.md` (this file)

### Modified Files
- `src/types.ts` — Remove neighborhood scale; update GeographicScaleContext signals
- `server.ts` — Add `/api/geographic-context/:city/:state` endpoint; integrate ApiCacheManager + providers
- `src/components/AnalysisTab.tsx` — Remove neighborhood section; update city/region sections to use real data with error states

---

## Testing & Verification

### Manual Testing
- [ ] Request stress test for SF, CA; verify geographic API is called
- [ ] Check localStorage; verify cache entry with 48h expiry
- [ ] Request same address again; verify cache hit (no API call)
- [ ] Wait 48h (or manually expire localStorage); verify cache miss triggers new API call
- [ ] Disable network; verify cached data still renders
- [ ] Clear localStorage; verify next request fetches from API
- [ ] Request address in region with no infrastructure data; verify "data unavailable" message
- [ ] Stop backend; verify geographic context section doesn't block report generation

### Type Checking
- Run `npm run lint` — no TypeScript errors

### API Testing
- Verify Census Bureau API responses map correctly to GeographicSignal
- Verify OpenStreetMap/USGS responses handle partial data

---

## Out of Scope

- Real-time data streaming (48h cache is sufficient)
- Predictive projections (real API data is historical/current)
- Climate migration or social fabric (no free data sources)
- Neighborhood-level insights (Census data not available at that granularity for free)

---

## Success Criteria

✅ Census API integration for 3 real signals per category  
✅ OpenStreetMap/USGS integration for infrastructure signals  
✅ City + region scales populated with real data  
✅ Neighborhood scale removed  
✅ 48-hour localStorage cache working  
✅ "No data available" messages replace procedural fallbacks  
✅ API failures don't block report generation  
✅ Type checking passes  
✅ Manual testing confirms expected behavior

---

## Notes

- Census Bureau API requires free API key (register at api.census.gov)
- OpenStreetMap Overpass API is free and doesn't require authentication
- USGS Open Data varies by dataset; some require registration
- 48-hour cache reduces API calls; adjust TTL if data freshness becomes critical
- Graceful degradation keeps app functional even if all APIs fail

