# production CORS and domain handling

**ID**: REQ-1774800055
**Status**: IN_PROGRESS  
**Priority**: HIGH
**Created**: 2026-03-29T16:00:55Z
Fix CORS configuration so frontend on Vercel can communicate with backend. Add CORSMiddleware to FastAPI with allow_origins configurable via environment. Source: code-review. Severity: HIGH. Evidence: server.py has no CORS config; requests from Vercel-deployed frontend will be blocked.

## Success Criteria

- [x] Both `api/models.js` and `api/chat.js` set CORS headers on all responses
- [ ] `Access-Control-Allow-Origin` is configurable via `ALLOWED_ORIGIN` environment variable (defaults to `*` for development)
- [ ] CORS preflight (OPTIONS) requests are handled correctly
- [ ] Production deployment with restricted origin accepts requests from the Vercel frontend domain only

## Technical Notes

**Issue**: The serverless functions (`api/chat.js`, `api/models.js`) already set `Access-Control-Allow-Origin: *` but this is hardcoded. For production, the origin should be restricted to the deployed Vercel domain.

**Affected Files**:
- `api/chat.js` — update CORS origin from `*` to read from `process.env.ALLOWED_ORIGIN`
- `api/models.js` — same update
- `vercel.json` — add `ALLOWED_ORIGIN` to env vars (optional, defaults to `*`)

**Approach**:
- Read `ALLOWED_ORIGIN` env var; fallback to `*` for local dev
- This allows Vercel dashboard to set the specific origin in production



## Development Plan

1. **Update `api/models.js`** — Replace hardcoded `*` with `process.env.ALLOWED_ORIGIN || '*'` for `Access-Control-Allow-Origin`.

2. **Update `api/chat.js`** — Same change for `Access-Control-Allow-Origin`.

3. **Update `vercel.json`** — Add `ALLOWED_ORIGIN` to env config (no default — let it be unset for local dev `*` fallback).

4. **Run `./scripts/regenerate-docs.sh`** — Sync manifests.

**Last updated**: 2026-03-29T16:14:41Z

## Dependencies

None (parent REQ-1774798344 is already merged)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
