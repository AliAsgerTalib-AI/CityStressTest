# Vercel Deployment Guide - CityStressTest

This guide walks you through deploying CityStressTest to Vercel with Google Gemini API integration.

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Push your code to GitHub
3. **Google Gemini API Key** - Get one from https://aistudio.google.com/app/apikey

## Step 1: Get Your Gemini API Key

1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Choose "Create new secret key in a new Google Cloud project" or use existing project
4. Copy the API key (you'll need it for Vercel)
5. **NEVER commit this to GitHub** - use Vercel Environment Variables instead

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: CityStressTest app ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/repository-name.git
git push -u origin main
```

## Step 3: Connect Vercel to Your Repository

1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Select your repository
5. Click "Import"

## Step 4: Configure Environment Variables in Vercel

After clicking "Import" on the previous step, you'll see the project configuration page:

### Environment Variables Section

Add these variables:

| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| `VITE_GEMINI_API_KEY` | Your actual API key | ✅ Yes | Get from https://aistudio.google.com/app/apikey |
| `VITE_GEMINI_MODEL` | `gemini-2.0-flash` | ❌ No | Default: gemini-2.0-flash. See model options below |
| `APP_URL` | Your Vercel domain | ❌ No | Auto-configured, or set manually |

### Gemini Model Options

Choose one based on your needs:

- **`gemini-2.0-flash`** (Recommended) - Latest, most capable, good speed
- **`gemini-2.0-flash-exp`** - Experimental, highest capability
- **`gemini-1.5-pro`** - Previous generation, very capable but slower
- **`gemini-1.5-flash`** - Smaller model, faster, suitable for simple tasks

**Important:** Model must support Google Search grounding and JSON output.

### Example Configuration:

```
VITE_GEMINI_API_KEY = sk-...your-key-here...
VITE_GEMINI_MODEL = gemini-2.0-flash
```

## Step 5: Deploy

1. Click "Deploy" button
2. Vercel will build and deploy your application
3. Wait for deployment to complete (usually 2-3 minutes)
4. You'll get a URL like: `https://citystresstest-abc123.vercel.app`

## Step 6: Test Your Deployment

Once deployed, test the API:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Miami, Florida"}'
```

Or use the web interface at `https://your-vercel-domain.vercel.app/`

## Important Notes

### Environment Variables Are Private

✅ Environment variables stored in Vercel are encrypted and private
✅ They are NOT exposed in source code or frontend
✅ Only server-side code can access them

### Cold Start Behavior

- First request after deployment takes 1-2 seconds (cold start)
- Subsequent requests are instant
- Google Gemini API calls typically take 3-10 seconds (depends on data grounding)

### Rate Limiting

Vercel Free Plan:
- 100 deployments/month
- Unlimited function invocations
- 100GB bandwidth/month

Google Gemini API:
- Free tier: 60 requests/minute
- Check current quotas at https://aistudio.google.com/app/apikey

### Logging

View deployment logs:
1. Go to your Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click on a deployment
5. Click "Logs" tab

## Troubleshooting

### "VITE_GEMINI_API_KEY is not defined"

**Solution:** Make sure you added `VITE_GEMINI_API_KEY` to Vercel Environment Variables:
1. Go to Vercel Project Settings
2. Go to Environment Variables
3. Add `VITE_GEMINI_API_KEY` with your actual key
4. Redeploy

### "Model not found"

**Solution:** Ensure `VITE_GEMINI_MODEL` is set to a valid model name:
- Valid: `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`
- Invalid: `gemini-3.5-flash` (doesn't exist yet)

### API Returns "No Data Available"

This is expected for locations without verified property market data (like Mumbai, Karachi). The app correctly returns:
- `dataQuality: "NO_DATA_AVAILABLE"`
- `baselinePriceSFH: 0`
- Procedurally generated climate data

With Gemini API enabled, it attempts to verify data via Google Search.

### Slow Response Times

Possible causes:
1. **Gemini API grounding** - Live Google Search can add 5-10 seconds
2. **Cold start** - First deployment request takes longer
3. **Network latency** - Geographic distance to Google servers

Monitor in Vercel logs under "Duration"

## Advanced: Updating Environment Variables

If you need to change `VITE_GEMINI_API_KEY` or `VITE_GEMINI_MODEL`:

1. Go to Vercel Project Settings → Environment Variables
2. Click the variable to edit
3. Update the value
4. Trigger a redeployment:
   - Push new code to main branch, OR
   - Click "Redeploy" in Deployments tab

## Advanced: Custom Domain

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel will show instructions)
4. Update `APP_URL` environment variable if needed

## Support

- **Vercel Issues:** https://vercel.com/support
- **Gemini API Issues:** https://aistudio.google.com
- **Project Issues:** Check GitHub Issues in your repository

---

**Last Updated:** June 2026  
**Compatible with:** Node.js 18.x+, Vercel v2 Functions
