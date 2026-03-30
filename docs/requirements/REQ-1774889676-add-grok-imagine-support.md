# add grok imagine support

**ID**: REQ-1774889676  
**Status**: CODE_REVIEW  
**Priority**: MEDIUM  
**Created**: 2026-03-30T16:54:36Z  

## Description

I want to make the chat support image output by using Grok Imagine image pro model (https://console.x.ai/team/0707afa0-cc45-4260-899b-419950d79ec7/models/grok-imagine-image-pro?cluster=us-east-1), note to update both local version and vercel version

## Success Criteria

- [ ] The local FastAPI server (`server.py`) exposes a `POST /api/imagine` endpoint that proxies image generation requests to the xAI Grok Imagine API using `grok-imagine-image-pro` model
- [ ] The Vercel serverless function (`api/imagine.js`) allows `grok-imagine-image-pro` in its `ALLOWED_MODELS` list alongside the existing `grok-imagine-image`
- [ ] The frontend `/imagine <prompt>` command (and Imagine button) successfully generates images via both local and Vercel deployments using the `grok-imagine-image-pro` model
- [ ] Users can select aspect ratio and resolution options that are forwarded correctly to the xAI `images/generations` endpoint for the pro model
- [ ] Error states (missing XAI_API_KEY, invalid prompt, API failures) return clear user-facing error messages on both local and Vercel versions

## Technical Notes

**Approach**: Add a new `/api/imagine` endpoint in `server.py` mirroring the logic already in `api/imagine.js`. Update the Vercel `api/imagine.js` to accept `grok-imagine-image-pro` as an allowed model. The frontend already has `/imagine` command handling and an Imagine button in `static/app.js` (`generateImage` function) — verify it works against both backends.

**Affected files**:
- `server.py`: Add `POST /api/imagine` endpoint with xAI API key validation, payload construction (model, prompt, n, response_format, aspect_ratio, resolution), and proxying to `{XAI_BASE}images/generations`
- `api/imagine.js`: Add `'grok-imagine-image-pro'` to `ALLOWED_MODELS` array
- `static/app.js`: Ensure `generateImage()` function targets `/api/imagine` and handles the pro model; may need model selection for imagine requests
- `static/index.html`: Verify imagine button and aspect-ratio/resolution selectors exist (already present from REQ-1774888513)
- `static/style.css`: Ensure imagine result display styles are consistent

**Risks**:
- The `grok-imagine-image-pro` model may have different API parameters or response formats compared to `grok-imagine-image` — validate against xAI API docs
- Local `server.py` currently has no imagine endpoint, so the FastAPI route must handle validation, CORS, and error responses consistently with the Vercel version
- Image generation can be slow (10+ seconds) — ensure httpx timeout is sufficient in the local server


## Development Plan

1. **Add `POST /api/imagine` endpoint to `server.py`** — Mirror `api/imagine.js` logic: validate `XAI_API_KEY` via `validate_xai_api_key()`, accept `prompt`, `model` (default `grok-imagine-image-pro`), `n`, `response_format`, `aspect_ratio`, `resolution`; proxy to `{XAI_BASE}images/generations` via `httpx.AsyncClient` with 120s timeout; return JSON response.
2. **Update `api/imagine.js` allowed models** — Add `'grok-imagine-image-pro'` to the `ALLOWED_MODELS` array so the Vercel deployment accepts the pro model.
3. **Update frontend `static/app.js`** — In the `generateImage()` function, set `model: 'grok-imagine-image-pro'` in the request payload (or add a model selector). Verify `/imagine` command and Imagine button send to `/api/imagine` correctly.
4. **Test both backends** — Run `server.py` locally (`uvicorn`) and test `/api/imagine` with a sample prompt. Verify Vercel `api/imagine.js` accepts the pro model. Confirm error handling for missing key / invalid prompt.
5. **Regenerate docs and validate** — Run `./scripts/regenerate-docs.sh` and `./scripts/show-requirement.sh REQ-1774889676` to confirm status and docs are in sync.

**Last updated**: 2026-03-30T16:57:58Z

## Dependencies

- REQ-1774887470 (Vercel direct xAI API and Grok Imagine support) — provides the existing `api/imagine.js` serverless function and xAI API utility functions
- REQ-1774888513 (Frontend Grok Imagine UI) — provides the `/imagine` command, Imagine button, and inline image rendering in `static/app.js`
- REQ-1774855463 (x-ai-direct API) — provides XAI_API_KEY configuration and validation patterns used by the imagine endpoint

## Worktree

feature/REQ-1774889676-add-grok-imagine-support

---

* **Linked Worktree**: feature/REQ-1774889676-add-grok-imagine-support
* **Branch**: feature/REQ-1774889676-add-grok-imagine-support
* **Merged**: No
* **Deployed**: No
