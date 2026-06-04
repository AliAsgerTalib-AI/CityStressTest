# Vercel Deployment Checklist - 5 Minute Setup

## ✅ Before You Start

- [ ] Vercel account created (https://vercel.com/signup)
- [ ] Code pushed to GitHub
- [ ] Gemini API key obtained (https://aistudio.google.com/app/apikey)

## ✅ Step 1: Import Project to Vercel (2 minutes)

1. [ ] Go to https://vercel.com/new
2. [ ] Click "Continue with GitHub"
3. [ ] Select your repository
4. [ ] Click "Import"

## ✅ Step 2: Add Environment Variables (2 minutes)

When prompted for "Environment Variables" before deploying, add:

```
GEMINI_API_KEY = your_actual_api_key_from_aistudio
GEMINI_MODEL = gemini-2.0-flash
```

## ✅ Step 3: Deploy (1 minute)

1. [ ] Click "Deploy"
2. [ ] Wait for build to complete
3. [ ] Copy your Vercel URL (e.g., `https://yourapp.vercel.app`)

## ✅ Step 4: Test Deployment

Visit your app in the browser:
```
https://your-vercel-domain.vercel.app
```

Try the API:
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/stress-test \
  -H "Content-Type: application/json" \
  -d '{"address":"Miami, Florida"}'
```

## ✅ All Done! 🎉

Your app is now live with Gemini API integration.

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| API key error | Add `GEMINI_API_KEY` to Vercel Environment Variables |
| Model not found | Change `GEMINI_MODEL` to `gemini-2.0-flash` |
| App won't load | Check logs: Deployments → Latest → Logs |
| Slow response | Normal for first Gemini request (includes Google Search) |

---

## Making Changes After Deployment

To update `GEMINI_API_KEY` or `GEMINI_MODEL`:

1. Go to Vercel Project Settings → Environment Variables
2. Edit the variable
3. Click "Redeploy" (automatic on next git push)

---

See `DEPLOYMENT.md` for detailed setup guide.
