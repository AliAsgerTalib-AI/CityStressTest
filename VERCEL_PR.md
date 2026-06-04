# Configure CityStressTest for Vercel Deployment

## Summary

Configures the CityStressTest application for seamless deployment on Vercel. The project uses a full-stack setup with React/Vite frontend and Express.js backend served from a single Node.js instance. All configuration changes are backward-compatible with local development.

## Changes

### `server.ts`
- **Dynamic PORT assignment**: Changed hardcoded `PORT = 3000` to `PORT = process.env.PORT || 3000`
  - Allows Vercel to dynamically assign ports during serverless execution
  - Maintains backward compatibility with local development (defaults to 3000)
- **Improved logging**: Added path logging in production mode to aid debugging

### `vercel.json`
- **Simplified configuration**: Replaced complex serverless function routing with standard Node.js deployment
- **Build command**: Uses `npm run build` (builds Vite frontend + bundles Express server with esbuild)
- **Output directory**: Set to `dist/` (where Vite and esbuild output their results)
- **Environment variables**: Configured two secrets:
  - `GEMINI_API_KEY` (required for AI-powered reports)
  - `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)

### `.vercelignore` (new file)
- Excludes unnecessary files from deployments (tests, markdown, node_modules, etc.)
- Reduces build time and deployment size

## How It Works on Vercel

1. **Build Phase**
   - Runs `npm run build`
   - Vite bundles React frontend → `dist/`
   - esbuild bundles Express server → `dist/server.cjs`

2. **Start Phase**
   - Vercel runs `npm start` (executes `node dist/server.cjs`)
   - Express server starts on dynamically assigned PORT
   - Serves API endpoints from `/api/*`
   - Serves frontend static files (SPA with index.html fallback)

3. **Environment**
   - `NODE_ENV` automatically set to `production` by Vercel
   - Server detects production mode and serves pre-built static files
   - Gemini API key injected at runtime

## Deployment Instructions

### Prerequisites
- Vercel account (free tier works)
- GitHub repository connected to Vercel
- Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Steps

1. **Create Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Set Environment Variables**
   - In Vercel project settings → "Environment Variables"
   - Add `GEMINI_API_KEY` with your actual API key
   - Optionally set `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)

3. **Deploy**
   - Vercel automatically deploys on push to main branch
   - Or manually trigger deployment from dashboard
   - Watch deployment progress in Vercel dashboard

4. **Verify**
   - Visit your Vercel deployment URL
   - Test address input form
   - Verify API calls work correctly

## Testing Locally (Before Deployment)

### Development Mode (unchanged)
```bash
npm run dev
# Runs tsx server.ts with Vite middleware
# Frontend hot reload enabled
```

### Production Simulation
```bash
npm run build
npm start
# Simulates Vercel deployment
# Serves pre-built files from dist/
# PORT can be set: PORT=3000 npm start
```

## Rollback Plan

If deployment fails:
1. Configuration changes are minimal and non-breaking
2. Local development unaffected (`npm run dev` still works)
3. Can revert `vercel.json` to previous version if needed
4. No database migrations or data changes

## Notes for Reviewers

- **Backward Compatibility**: All changes are backward compatible with local development
- **No Breaking Changes**: Existing npm scripts (dev, build, start, lint) unchanged
- **Minimal Configuration**: Uses Vercel's standard Node.js deployment model (not serverless functions)
- **Cost**: Vercel's free tier includes sufficient resources for this use case

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) — Project architecture and development guide
- [vercel.json](./vercel.json) — Full Vercel configuration
- [.vercelignore](./.vercelignore) — Files excluded from Vercel deployments

---

**Author**: Claude Code  
**Date**: 2026-06-04  
**Status**: Ready for Review
