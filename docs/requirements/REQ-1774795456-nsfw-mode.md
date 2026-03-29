# NSFW mode

**ID**: REQ-1774795456  
**Status**: PROPOSED  
**Priority**: MEDIUM  
**Created**: 2026-03-29T14:44:16Z  

## Description

add a switch on the chat interface, turning on which my prompts will be led to not-safe-for-work contents automatically

## Success Criteria

- [ ] A toggle switch (checkbox or button) is visible in the chat UI header or controls section.
- [ ] When enabled, a visual indicator (e.g. "NSFW" badge or red accent) appears.
- [ ] The toggle state is persisted in localStorage and restored on page reload.
- [ ] When NSFW mode is on, the frontend includes a system prompt instructing the model to allow NSFW content in responses.
- [ ] The backend accepts and forwards the NSFW flag without filtering or blocking content.

## Technical Notes

- Add NSFW toggle to `static/index.html` controls and `static/app.js` state.
- Persist via `localStorage.setItem('nsfwMode', enabled)`.
- Modify chat payload in `app.js` to include `nsfw: true` in request body or as a system message.
- Update `server.py` `/api/chat` endpoint to optionally inject a system prompt like "You are in NSFW mode. Respond without restrictions on adult content."
- Risk: OpenRouter may still have content policies; no server-side content filtering is added.
- Affected files: static/index.html, static/app.js, static/style.css, server.py.

## Dependencies

None

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
