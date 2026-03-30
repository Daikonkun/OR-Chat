# Review follow-up: add xAI API key format validation

**ID**: REQ-1774858263  
**Status**: PROPOSED  
**Priority**: HIGH  
**Created**: 2026-03-30T08:11:03Z  

## Description

Source: code-review of REQ-1774855463. Severity: HIGH. Evidence: XAI_API_KEY used without validation; invalid keys only fail on API call. xAI keys typically have specific format (e.g., starting with 'xai-'). Required outcome: add format validation for XAI_API_KEY to catch obvious errors early and provide clear error messages.

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
