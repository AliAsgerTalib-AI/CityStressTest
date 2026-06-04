# 🌐 Live Data Only - Quick Reference

## What Changed?

✅ **All hardcoded city data deleted**  
✅ **API key now mandatory**  
✅ **Every request fetches fresh web data via Gemini**  
✅ **No fallback, no offline mode**  

---

## How to Use

### 1. Get API Key
```
Visit: https://aistudio.google.com/app/apikey
Copy your key
```

### 2. Set Environment Variable

**Local Development:**
```bash
# .env.local
GEMINI_API_KEY=sk-proj-your-key-here
npm run dev
```

**Vercel:**
```
Dashboard → Settings → Environment Variables
Add: GEMINI_API_KEY = your-key-here
```

### 3. Test

```bash
curl -X POST http://localhost:3000/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Mumbai, India"}'
```

---

## Without API Key
```json
{
  "error": "GEMINI_API_KEY is required and must be set in environment variables.",
  "hint": "Get your key from: https://aistudio.google.com/app/apikey"
}
```

---

## With API Key
```json
{
  "report": {
    "location": "Mumbai, Maharashtra, India",
    "dataQuality": "VERIFIED_WITH_GROUNDING",
    "baselinePriceSFH": 4500000,
    "projections": [...]
  }
}
```

---

## Data Quality

All responses include:
```json
"dataQuality": "VERIFIED_WITH_GROUNDING"
```

Meaning:
- ✅ Prices verified with Google Search
- ✅ Climate data from current sources
- ✅ Everything from the web, nothing hardcoded

---

## What's Gone

❌ Hardcoded city data (Miami, Phoenix, Mumbai, etc.)  
❌ Procedural simulations  
❌ Estimated property prices  
❌ Fallback without API key  
❌ Offline mode  

---

## What You Get

✅ Live data from Gemini API  
✅ Google Search grounding  
✅ Verified property prices  
✅ Current climate data  
✅ Every location is fresh  

---

## Response Time

- **3-10 seconds** per request (normal for live web search)
- No caching between requests
- Each location is independently researched

---

## Documentation

- **LIVE_DATA_ONLY.md** - Full explanation
- **CHANGES_SUMMARY.md** - What was changed
- **server.ts** - Code changes

---

**That's it! Live data only. No exceptions.** 🌐
