# deployment

**ID**: REQ-1774798344  
**Status**: IN_PROGRESS  
**Priority**: MEDIUM  
**Created**: 2026-03-29T15:32:24Z  

## Description

prepare a deployment of this chat to vercel

## Success Criteria

- [ ] Application builds successfully with `vercel build` without errors
- [ ] `vercel dev` starts the development server and serves the chat interface at localhost:3000
- [ ] Environment variables (OPENROUTER_API_KEY) are configurable via Vercel dashboard
- [ ] Static assets (HTML, CSS, JS) are properly served in production
- [ ] API routes proxy correctly to the FastAPI backend or are adapted for Vercel Edge Functions
- [ ] Deployment completes and returns a live URL accessible for testing

## Technical Notes

**Approach**:
- Evaluate whether to use Vercel Serverless Functions (Node.js) for API proxying or keep FastAPI backend separate
- If backend stays standalone, the frontend (static/) deploys to Vercel with proper routing for SPA
- Create `vercel.json` configuration for routing and environment variable mapping
- Document any API endpoint changes needed for CORS with Vercel domains

**Affected Areas**:
- `static/` - frontend assets (already static, minimal changes)
- `server.py` - may need CORS updates for production domain
- Root level - add `vercel.json`, `.vercelignore`
- Create `api/` directory if converting endpoints to Vercel Functions

**Risks**:
- OpenRouter API key must never be exposed client-side; backend proxy is required
- Streaming responses may not work with standard Vercel serverless functions (may need Edge Functions)
- Cold start latency on serverless functions


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774798344-deployment.md`.
   - **Summary**: prepare a deployment of this chat to vercel
   - **Key criteria**: - [ ] Application builds successfully with `vercel build` without errors - [ ] `vercel dev` starts t
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: **Approach**:
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774798344` and verify success criteria are met.

**Last updated**: 2026-03-29T15:39:54Z

## Dependencies

None

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
