# Review follow-up: rate-limit login attempts

**ID**: REQ-1774926063  
**Status**: PROPOSED  
**Priority**: MEDIUM  
**Created**: 2026-03-31T03:01:03Z  

## Description

Source: code-review of REQ-1774891701. Severity: MEDIUM. Evidence: Neither server.py nor api/login.js limits login attempts, allowing unlimited password guessing attacks against the Vercel deployment. Required outcome: Add rate limiting to POST /api/login on both FastAPI (e.g., slowapi) and Vercel (e.g., in-memory or KV-based counter) backends, returning HTTP 429 after excessive failed attempts within a time window.

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
