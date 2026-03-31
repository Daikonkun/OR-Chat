# Review follow-up: rate-limit login attempts

**ID**: REQ-1774926063  
**Status**: MERGED  
**Priority**: MEDIUM  
**Created**: 2026-03-31T03:01:03Z  

## Description

Source: code-review of REQ-1774891701. Severity: MEDIUM. Evidence: Neither server.py nor api/login.js limits login attempts, allowing unlimited password guessing attacks against the Vercel deployment. Required outcome: Add rate limiting to POST /api/login on both FastAPI (e.g., slowapi) and Vercel (e.g., in-memory or KV-based counter) backends, returning HTTP 429 after excessive failed attempts within a time window.

## Success Criteria

- [x] FastAPI `POST /api/login` returns HTTP 429 after more than 5 failed login attempts from the same IP within a 15-minute window
- [x] Vercel `api/login.js` returns HTTP 429 after more than 5 failed login attempts from the same IP within a 15-minute window
- [x] Successful logins are not counted toward the rate limit
- [x] Rate-limit responses include a `Retry-After` header indicating seconds until the window resets
- [x] Existing tests pass; new test cases cover rate-limit enforcement and window expiry

## Technical Notes

- **FastAPI**: Use an in-process dict keyed by client IP tracking `(count, window_start)`. No new dependency needed — the login endpoint is low-traffic and a simple dict is sufficient for the local dev server.
- **Vercel**: Use an in-memory `Map` in `api/login.js` (Vercel cold-starts reset state, providing natural cleanup). For production durability, a KV store could be added later.
- **IP extraction**: FastAPI → `request.client.host`; Vercel → `req.headers['x-forwarded-for']` first segment or `req.socket.remoteAddress`.
- **Config**: `RATE_LIMIT_MAX_ATTEMPTS=5` and `RATE_LIMIT_WINDOW_SECONDS=900` from env with defaults.
- Both backends share the same semantics: only **failed** attempts increment the counter; a successful login resets the counter for that IP.

## Development Plan

1. **Add rate limiting to FastAPI `POST /api/login`** in `server.py` — add an in-process rate-limit dict, check/increment on failed attempts, return 429 with `Retry-After` header when exceeded.
2. **Add rate limiting to Vercel `api/login.js`** — add a module-level `Map` for tracking attempts per IP, same 5-attempt / 15-min logic, return 429 with `Retry-After`.
3. **Add tests** in `test_validation.py` — test that the 6th failed login within the window gets 429, that the counter resets on success, and that expired windows allow new attempts.
4. **Regenerate docs** — run `./scripts/regenerate-docs.sh` to update manifests.
5. **Validate** — run `./scripts/show-requirement.sh REQ-1774926063` and confirm all success criteria are met.

**Last updated**: 2026-03-31T03:13:36Z

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
