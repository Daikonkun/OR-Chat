# Vercel direct xAI API and Grok Imagine support

**ID**: REQ-1774887470  
**Status**: IN_PROGRESS  
**Priority**: HIGH  
**Created**: 2026-03-30T16:17:50Z  

## Description

Port the direct xAI API routing from server.py to the Vercel serverless functions (api/models.js and api/chat.js). When XAI_API_KEY is configured, x-ai models should route through the xAI API directly instead of OpenRouter. Additionally, add support for the Grok Imagine API for image generation. The api/models.js endpoint should expose the uses_direct_api flag matching server.py behavior.

## Success Criteria

- [ ] `api/models.js` returns `uses_direct_api: true` for x-ai models when `XAI_API_KEY` env var is set and valid
- [ ] `api/chat.js` routes x-ai model requests to `XAI_BASE` (direct xAI API) when `XAI_API_KEY` is configured, stripping the `x-ai/` prefix from the model ID
- [ ] `api/chat.js` falls back to OpenRouter when `XAI_API_KEY` is not set or invalid, preserving existing behavior
- [ ] A new `api/imagine.js` serverless function proxies Grok Imagine API requests (image generation) to the xAI image generation endpoint
- [ ] The frontend displays the `⚡ xAI Direct` badge on the deployed Vercel version when direct API is active, matching the local `server.py` behavior

## Technical Notes

**Approach**: Port the direct xAI API routing logic from `server.py` (lines 155–195) into the Vercel serverless functions. Add xAI API key validation (prefix `xai-`, min length, alphanumeric + hyphens) as a JS utility shared between `api/models.js` and `api/chat.js`.

**Affected files**:
- `api/models.js`: Add `XAI_API_KEY` / `XAI_BASE` env var reads, key validation, and `uses_direct_api` flag in response
- `api/chat.js`: Add routing logic — when `use_direct_xai` is true, send to `XAI_BASE/chat/completions` with bearer token and stripped model ID
- `api/imagine.js` (new): Serverless function to proxy image generation requests to xAI Grok Imagine API
- `vercel.json`: Add route for `/api/imagine`
- `static/app.js`: May need UI additions for image generation triggers

**Risks**:
- xAI API request/response format may differ slightly from OpenRouter's wrapper (parameter mapping)
- Grok Imagine API may have different auth or endpoint patterns — needs xAI docs verification
- SSE streaming through Vercel serverless has a ~25s execution limit on Hobby plan


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774887470-vercel-direct-xai-api-and-grok-imagine-support.md`.
   - **Summary**: Port the direct xAI API routing from server.py to the Vercel serverless function
   - **Key criteria**: - [ ] `api/models.js` returns `uses_direct_api: true` for x-ai models when `XAI_API_KEY` env var is 
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: **Approach**: Port the direct xAI API routing logic from `server.py` (lines 155–195) into the Vercel
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774887470` and verify success criteria are met.

**Last updated**: 2026-03-30T16:19:27Z

## Dependencies

- REQ-1774855463 (x-ai-direct-api) — the local `server.py` implementation this requirement ports to Vercel

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
