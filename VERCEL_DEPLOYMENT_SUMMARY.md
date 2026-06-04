# Vercel Deployment - Complete Summary

## What Was Done

Your CityStressTest application is now **fully configured for Vercel deployment** with proper environment variable handling for Gemini API.

### ✅ Changes Made

#### 1. **Server Configuration (server.ts)**
- ✅ Made Gemini model name configurable via `GEMINI_MODEL` env variable
- ✅ Default model: `gemini-2.0-flash` (can be overridden)
- ✅ Proper environment variable reading with fallbacks
- ✅ Maintains compatibility with Gemini API with Google Search grounding

#### 2. **Vercel Configuration (vercel.json)**
- ✅ Created `vercel.json` with proper build/dev commands
- ✅ Configured environment variable references
- ✅ Set Node.js runtime to 18.x (recommended)
- ✅ Proper API route rewrites for `/api/*` endpoints

#### 3. **Environment Variables (.env.example)**
- ✅ Documented all required and optional environment variables
- ✅ Added instructions for Vercel deployment
- ✅ Listed available Gemini models with capabilities
- ✅ Clear explanations of each variable

#### 4. **Documentation**
- ✅ `DEPLOYMENT.md` - Comprehensive step-by-step deployment guide
- ✅ `VERCEL_SETUP_CHECKLIST.md` - Quick 5-minute setup checklist
- ✅ Troubleshooting sections for common issues

---

## Vercel Environment Variables You Need to Set

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `GEMINI_API_KEY` | `sk-proj-abc123...` | Your Google Gemini API key (required) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Which Gemini model to use (optional) |

**Where to set them:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the variables listed above
3. Redeploy your project

---

## How It Works

### Local Development
```bash
npm run dev
# Uses: .env.local or .env.example values
# API Key: From your .env file
```

### Vercel Production
```
User Request
    ↓
Vercel Function
    ↓
Read GEMINI_API_KEY from Vercel Environment Variables
    ↓
Read GEMINI_MODEL from Vercel Environment Variables (or default)
    ↓
Initialize Gemini Client with API key
    ↓
Call Google Gemini API with specified model
    ↓
Return stress-test report to user
```

---

## Supported Gemini Models

All models below support Google Search grounding and JSON output:

| Model | Speed | Capability | Best For |
|-------|-------|-----------|----------|
| `gemini-2.0-flash` | Very Fast | Very High | ⭐ Recommended - balanced |
| `gemini-2.0-flash-exp` | Fast | Highest | Complex analysis, highest accuracy |
| `gemini-1.5-pro` | Moderate | Very High | Detailed analysis |
| `gemini-1.5-flash` | Fast | High | Budget-conscious, still excellent |

Set via `GEMINI_MODEL` environment variable in Vercel.

---

## Data Quality with Vercel Deployment

### With Gemini API Enabled (Recommended)
```json
{
  "dataQuality": "VERIFIED_WITH_GROUNDING",
  "baselinePriceSFH": 450000,
  "baselinePriceNote": "Property price verified with live Google Search grounding and local market data."
}
```
✅ Real property prices  
✅ Verified climate data  
✅ Location-specific research  

### Fallback (No API Key)
```json
{
  "dataQuality": "NO_DATA_AVAILABLE",
  "baselinePriceSFH": 0,
  "baselinePriceNote": "No verified property market data available..."
}
```
✅ Still generates valid stress-test analysis  
⚠️ Uses procedural climate models  

---

## Deployment Checklist

```bash
# 1. Ensure code is committed and pushed
git status
git add .
git commit -m "Vercel deployment ready"
git push origin main

# 2. Go to https://vercel.com/new

# 3. Import repository, add environment variables:
#    GEMINI_API_KEY = your_key_here
#    GEMINI_MODEL = gemini-2.0-flash

# 4. Click Deploy

# 5. Test:
curl -X POST https://your-domain.vercel.app/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Mumbai, India"}'
```

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Cold start | 1-2s | First request after deployment |
| Warm request | <100ms | Subsequent requests |
| Gemini API call | 3-10s | Includes Google Search grounding |
| Total response | 3-12s | Depends on API availability |

---

## Monitoring & Troubleshooting

### View Logs
1. Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click latest deployment
4. Click "Logs" tab

### Check Environment Variables
1. Vercel Dashboard → Your Project
2. Click "Settings" tab
3. Click "Environment Variables"
4. Verify `GEMINI_API_KEY` and `GEMINI_MODEL` are set

### Common Issues

**Q: API returns "No Data Available"**
- A: Normal for locations without property market data. Gemini API will enhance this with Google Search.

**Q: "Model not found" error**
- A: Check `GEMINI_MODEL` value. Must be one of the supported models (e.g., `gemini-2.0-flash`)

**Q: Slow first response**
- A: Normal cold start + Gemini API latency. Caches responses automatically after first call.

---

## Cost Considerations

### Vercel
- Free tier includes unlimited deployments and functions
- Generous bandwidth: 100GB/month
- Scales automatically with traffic

### Google Gemini API
- Free tier: 60 requests/minute
- Paid tier: $0.075/1M input tokens, $0.30/1M output tokens
- Monitor usage at https://aistudio.google.com

---

## Security Best Practices

✅ **Store API key in Vercel Environment Variables (encrypted)**  
❌ Don't commit API key to GitHub  
❌ Don't log API key to console  
✅ Vercel auto-redacts env vars in logs  

---

## Next Steps

1. **Quick Start:** Follow `VERCEL_SETUP_CHECKLIST.md` (5 minutes)
2. **Detailed Setup:** Read `DEPLOYMENT.md` (10-15 minutes)
3. **Test:** Use curl or web interface to test your deployment
4. **Monitor:** Watch Vercel logs during first few requests

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Gemini API Docs:** https://aistudio.google.com/app/apikey
- **This Project:** `DEPLOYMENT.md` and `VERCEL_SETUP_CHECKLIST.md`

---

**You're all set for Vercel deployment! 🚀**
