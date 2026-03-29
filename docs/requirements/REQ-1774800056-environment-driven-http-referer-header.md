# environment-driven HTTP-Referer header

**ID**: REQ-1774800056  
**Status**: PROPOSED  
**Priority**: MEDIUM  
**Created**: 2026-03-30T00:00:02Z
Make HTTP-Referer and X-Title headers environment-driven so they reflect the actual deployment origin. Source: code-review. Severity: HIGH. Evidence: server.py hardcodes HTTP-Referer to localhost:8888 which misleads OpenRouter in production.

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
