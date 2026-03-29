# production CORS and domain handling

**ID**: REQ-1774800055  
**Status**: PROPOSED  
**Priority**: HIGH  
**Created**: 2026-03-30T00:00:01Z
Fix CORS configuration so frontend on Vercel can communicate with backend. Add CORSMiddleware to FastAPI with allow_origins configurable via environment. Source: code-review. Severity: HIGH. Evidence: server.py has no CORS config; requests from Vercel-deployed frontend will be blocked.

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

(Add implementation notes here)

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
