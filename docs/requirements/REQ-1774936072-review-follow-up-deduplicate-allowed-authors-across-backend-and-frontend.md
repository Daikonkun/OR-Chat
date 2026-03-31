# Review follow-up: deduplicate ALLOWED_AUTHORS across backend and frontend

**ID**: REQ-1774936072  
**Status**: PROPOSED  
**Priority**: MEDIUM  
**Created**: 2026-03-31T05:47:52Z  

## Description

Source: code-review of REQ-1774929776. Severity: MEDIUM. Evidence: ALLOWED_AUTHORS is defined independently in api/models.js, api/chat.js, server.py, and static/index.html (hardcoded <option> tags). Adding a new author requires updating 4 files, and the chat.js copy was missed during initial implementation. Required outcome: consolidate the author list into a single source of truth — either a shared config consumed by both Vercel functions and server.py, or dynamically populate the frontend author dropdown from the API response's distinct authors.

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
