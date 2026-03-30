# Vercel direct xAI API and Grok Imagine support

**ID**: REQ-1774887470  
**Status**: PROPOSED  
**Priority**: HIGH  
**Created**: 2026-03-30T16:17:50Z  

## Description

Port the direct xAI API routing from server.py to the Vercel serverless functions (api/models.js and api/chat.js). When XAI_API_KEY is configured, x-ai models should route through the xAI API directly instead of OpenRouter. Additionally, add support for the Grok Imagine API for image generation. The api/models.js endpoint should expose the uses_direct_api flag matching server.py behavior.

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
