# environment-driven HTTP-Referer header

**ID**: REQ-1774800056
**Status**: MERGED  
**Priority**: MEDIUM
**Created**: 2026-03-29T16:00:56Z
Make HTTP-Referer and X-Title headers environment-driven so they reflect the actual deployment origin. Source: code-review. Severity: HIGH. Evidence: server.py hardcodes HTTP-Referer to localhost:8888 which misleads OpenRouter in production.

## Success Criteria

- [x] `HTTP-Referer` header is read from `OPENROUTER_HTTP_REFERER` env var (default: `http://localhost:8888`)
- [x] `X-Title` header is read from `OPENROUTER_X_TITLE` env var (default: `OpenRouter Local Wrapper`)
- [x] Missing env vars do not cause errors — defaults are used when env vars are unset or empty
- [x] Header values are correctly forwarded to OpenRouter API calls (verified via logs or test)

## Technical Notes

Implementation approach:
- In `server.py`, read `HTTP-Referer` from `os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:8888")`
- Read `X-Title` from `os.getenv("OPENROUTER_X_TITLE", "OpenRouter Local Wrapper")`
- Both env vars can be left unset — defaults match the current hardcoded values
- No other files need changes; the frontend does not set these headers

## Development Plan

1. Update Success Criteria and Technical Notes in the spec file (done).
2. Edit `server.py` — replace hardcoded `"HTTP-Referer"` and `"X-Title"` values with `os.getenv()` calls.
3. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
4. Validate with `./scripts/show-requirement.sh REQ-1774800056`.

**Last updated**: 2026-03-30
