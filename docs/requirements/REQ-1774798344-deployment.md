# deployment

**ID**: REQ-1774798344  
**Status**: IN_PROGRESS  
**Priority**: MEDIUM  
**Created**: 2026-03-29T15:32:24Z  

## Description

prepare a deployment of this chat to vercel

## Success Criteria

- [x] Application builds successfully with `vercel build` without errors
- [ ] `vercel dev` starts the development server and serves the chat interface at localhost:3000
- [x] Environment variables (OPENROUTER_API_KEY) are configurable via Vercel dashboard
- [x] Static assets (HTML, CSS, JS) are properly served in production
- [x] API routes proxy correctly to Vercel serverless functions (api/models.js, api/chat.js)
- [ ] Deployment completes and returns a live URL accessible for testing
- [x] App is fully self-contained on Vercel — no separate backend required

## Technical Notes

**Approach**:
- Backend converted from FastAPI to Vercel Serverless Functions (Node.js)
- `api/models.js` — lists filtered models (x-ai, deepseek)
- `api/chat.js` — proxies chat completions to OpenRouter with streaming support
- Static frontend (`static/`) served from Vercel's CDN
- `server.py` retained locally for development only; not deployed

**Affected Areas**:
- `api/` — new directory with serverless functions (models.js, chat.js)
- `vercel.json` — updated routes for /api/*
- `.vercelignore` — updated to allow api/ directory
- `static/app.js` — no changes needed (API calls go to same /api/* paths)

**Risks Mitigated**:
- CORS handled in serverless functions (Access-Control-Allow-Origin: *)
- HTTP-Referer set dynamically via Vercel URL env var
- Streaming supported via Vercel's streaming response API


## Development Plan

1. **Install Vercel CLI** — Run `npm i -g vercel` globally if not already installed. Verify with `vercel --version`.

2. **Create `vercel.json`** — In the worktree root, add a config that:
   - Sets `buildCommand` to skip backend (since `server.py` is standalone)
   - Configures `rewrites` for SPA routing if needed
   - Maps `OPENROUTER_API_KEY` as a required env var

3. **Create `.vercelignore`** — Exclude `server.py`, `requirements.txt`, `docs/`, and other backend files from the frontend deployment.

4. **Test with `vercel dev`** — Run in the worktree to start local dev server at localhost:3000 and verify the chat UI loads.

5. **Run `./scripts/regenerate-docs.sh`** — Update manifests and generated docs to reflect completion once criteria are met.

**Last updated**: 2026-03-29T15:39:54Z

## Dependencies

- REQ-1774800055: production CORS and domain handling (follow-up)
- REQ-1774800056: environment-driven HTTP-Referer header (follow-up)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
