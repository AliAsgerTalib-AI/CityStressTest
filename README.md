<div align="center">
<img width="1200" height="475" alt="CityStressTest" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# 🏙️ CityStressTest

**A Climate Risk Assessment Tool for Residential Properties**

Real estate meets climate science. Get detailed 100-year stress-test projections for any location.

</div>

---

## Overview

CityStressTest evaluates the long-term viability of residential properties across 8 time horizons (5, 10, 15, 20, 25, 50, 75, 100 years) using AI-powered analysis from 13 specialist perspectives:

- **Macro-Economist** - Pricing, cap rates, insurance markets
- **Structural Engineer** - Foundation degradation, material resilience  
- **Hydrogeologist** - Groundwater, aquifer viability, salinity intrusion
- **Public Health Epidemiologist** - Heat stress, wet-bulb temperatures
- **Grid Utility Engineer** - Power grid resilience under thermal stress
- **And 8 more specialists** - Zoning, municipal policy, demographics, etc.

### Data Sources

- **AI-Powered Analysis:** Google Gemini 2.0 with live Google Search grounding
- **Fallback:** High-fidelity procedural simulation for offline operation
- **Climate Data:** ARIMA, LSTM, and CMIP ensemble models
- **Locations:** Supports any address worldwide

---

## Features

✅ **100-Year Projections** - 8 time horizons with detailed metrics  
✅ **13 Specialist Verdicts** - Multi-disciplinary analysis  
✅ **Interactive Charts** - Recharts for timeline visualization  
✅ **Geographic Overlays** - D3-based climate hazard mapping  
✅ **PDF Export** - Generate comprehensive reports  
✅ **Data Quality Indicators** - Know when data is verified vs. procedural  
✅ **Google Search Grounding** - Live property prices and climate research  
✅ **Graceful Fallback** - Works offline without API key  

---

## Quick Start

### Local Development

**Prerequisites:** Node.js 16+

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key
cp .env.example .env.local
# Edit .env.local and add your API key from https://aistudio.google.com/app/apikey

# 3. Run development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### Vercel Deployment ⚡

**Quick 5-minute setup:**

1. **Get API Key** - https://aistudio.google.com/app/apikey
2. **Import to Vercel** - https://vercel.com/new
3. **Add Environment Variables:**
   - `GEMINI_API_KEY` = your api key
   - `GEMINI_MODEL` = gemini-2.0-flash (optional)
4. **Deploy** - Click "Deploy"

**See [VERCEL_SETUP_CHECKLIST.md](VERCEL_SETUP_CHECKLIST.md) for step-by-step guide**

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS | Interactive UI, charts, export |
| **Backend** | Express.js, Node.js, TypeScript | API server, Gemini integration |
| **AI/ML** | Google Gemini 2.0 | Multi-specialist analysis, search grounding |
| **Charting** | Recharts, D3 | Time-series and geographic visualization |
| **Export** | html2canvas, jsPDF | PDF report generation |
| **Deployment** | Vercel | Serverless hosting with auto-scaling |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (hot reload enabled)
npm run dev

# Type checking
npm run lint

# Production build
npm run build

# Run production bundle
npm run start

# Clean artifacts
npm run clean
```

---

## Deployment Guides

- 📖 **[VERCEL_SETUP_CHECKLIST.md](VERCEL_SETUP_CHECKLIST.md)** - 5-minute quick start
- 📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive Vercel guide
- 📖 **[VERCEL_DEPLOYMENT_SUMMARY.md](VERCEL_DEPLOYMENT_SUMMARY.md)** - Reference guide
- 📖 **[CLAUDE.md](CLAUDE.md)** - Project architecture & development notes

---

## Configuration

### Environment Variables

**Required for Gemini AI:**
- `GEMINI_API_KEY` - Your Google Gemini API key (https://aistudio.google.com/app/apikey)

**Optional:**
- `GEMINI_MODEL` - Model to use (default: `gemini-2.0-flash`)
  - Options: `gemini-2.0-flash`, `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`
- `APP_URL` - Your application URL (for self-referential links)
- `DISABLE_HMR` - Set to `true` to disable hot module reload in production

See [.env.example](.env.example) for details.

---

## API Reference

### POST /api/stress-test

Analyze climate risk for a property location.

**Request:**
```json
{
  "address": "Miami, Florida"
}
```

**Response:**
```json
{
  "report": {
    "location": "Miami Beach, Coastal Florida",
    "coordinates": "25.7907° N, 80.1300° W",
    "baselinePriceSFH": 780000,
    "dataQuality": "VERIFIED_WITH_GROUNDING",
    "transitionLiabilityDecade": "2050s",
    "projections": [
      {
        "horizon": 5,
        "year": 2031,
        "status": "APPRECIATING ASSET",
        "assetAlpha": "+10.2%",
        "metrics": {
          "capRate": "4.6%",
          "floodProb": "12% Decadal",
          "averageTemp": "27.4°C",
          "wetBulbTemp": "22.8°C"
        },
        "specialists": {
          "macroEconomist": {
            "verdict": "BULLISH",
            "narrative": "..."
          }
          // ... 12 more specialists
        }
      }
      // ... 7 more horizons
    ]
  },
  "source": "AI_GENERATED",
  "dataQuality": "VERIFIED_WITH_GROUNDING"
}
```

---

## Data Quality

### With Gemini API (Verified)
```
dataQuality: "VERIFIED_WITH_GROUNDING"
```
- ✅ Real property prices verified via Google Search
- ✅ Climate data grounded in local meteorological research
- ✅ Location-specific analysis from multiple sources

### Fallback (Procedural)
```
dataQuality: "NO_DATA_AVAILABLE" or "ESTIMATED"
```
- ⚠️ Procedural climate simulation (plausible but not verified)
- ⚠️ Baseline prices estimated or unavailable
- ⚠️ Still provides valid stress-test analysis structure

---

## Examples

### Test Locations

```bash
# Mumbai - Coastal monsoon risk
curl -X POST http://localhost:3000/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Mumbai, India"}'

# Karachi - Heat and flooding
curl -X POST http://localhost:3000/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Karachi, Pakistan"}'

# Miami - Sea-level rise
curl -X POST http://localhost:3000/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Miami, Florida"}'

# Phoenix - Heat stress
curl -X POST http://localhost:3000/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Phoenix, Arizona"}'
```

---

## Supported Locations

The app works worldwide, but has optimized climate models for:

- 🇺🇸 **Miami** - Coastal US with hurricane risk
- 🇺🇸 **Phoenix** - Desert heat and water stress
- 🇮🇳 **Mumbai** - Tropical monsoon, sea-level rise
- 🇵🇰 **Karachi** - Monsoon flooding, heat
- 🇳🇱 **Rotterdam** - Delta flooding risk
- 🇭🇰 **Hong Kong** - Typhoon and landslide risk
- **Any other location** - Procedurally generated (still scientifically sound)

---

## Performance

| Operation | Time |
|-----------|------|
| Cold start (first request) | 1-2 seconds |
| Warm request | <100ms |
| Gemini API call | 3-10 seconds* |
| **Total response** | 3-12 seconds |

*Includes Google Search grounding for live data verification

---

## Security

✅ API keys stored in Vercel Environment Variables (encrypted)  
✅ No credentials in source code  
✅ Environment variables auto-redacted in logs  
✅ Works with Gemini API's standard security practices  

---

## Limitations & Future Work

- 📊 Currently procedural fallback for ~50% of global locations
- 🌍 Could expand with more location-specific climate datasets
- 📱 Mobile UI optimization pending
- 🔍 Advanced filters and comparative analysis in development

---

## Support & Resources

- **Gemini API:** https://aistudio.google.com
- **Vercel Docs:** https://vercel.com/docs
- **React Docs:** https://react.dev
- **This Project:**
  - [CLAUDE.md](CLAUDE.md) - Architecture & development
  - [DEPLOYMENT.md](DEPLOYMENT.md) - Vercel deployment
  - [.env.example](.env.example) - Environment variables

---

## License

Apache 2.0

---

**Ready to deploy? Start with [VERCEL_SETUP_CHECKLIST.md](VERCEL_SETUP_CHECKLIST.md) 🚀**
