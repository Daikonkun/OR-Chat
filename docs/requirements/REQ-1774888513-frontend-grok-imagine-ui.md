# Frontend Grok Imagine UI

**ID**: REQ-1774888513  
**Status**: IN_PROGRESS  
**Priority**: MEDIUM  
**Created**: 2026-03-30T16:35:13Z  

## Description

Add UI elements to the chat frontend for triggering image generation via the /api/imagine endpoint. Source: code-review of REQ-1774887470. The imagine API backend exists but is unreachable from the UI. Required outcome: users can generate images from the chat interface using Grok Imagine, with prompt input, aspect ratio/resolution options, and inline image display.

## Success Criteria

- [ ] A dedicated image generation trigger (button or `/imagine` command) is available in the chat UI
- [ ] Users can enter a text prompt and optionally select aspect ratio and resolution before generating
- [ ] Generated images are displayed inline in the chat messages area
- [ ] Loading state is shown while the image is being generated
- [ ] Error messages from the API are displayed clearly to the user

## Technical Notes

**Approach**: Add an image generation mode to the existing chat UI. Could be a `/imagine <prompt>` slash command detected in `static/app.js` before send, or a separate button next to the send button. The `/api/imagine` endpoint already handles validation and proxying.

**Affected files**:
- `static/app.js`: Add imagine command detection, API call to `/api/imagine`, and inline image rendering
- `static/index.html`: Add UI elements (optional aspect ratio/resolution selectors, imagine button)
- `static/style.css`: Style the generated image display and any new controls

**Risks**:
- Image generation can take several seconds — needs clear loading feedback
- xAI image URLs are temporary — may need to handle expiration gracefully


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774888513-frontend-grok-imagine-ui.md`.
   - **Summary**: Add UI elements to the chat frontend for triggering image generation via the /ap
   - **Key criteria**: - [ ] A dedicated image generation trigger (button or `/imagine` command) is available in the chat U
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: **Approach**: Add an image generation mode to the existing chat UI. Could be a `/imagine <prompt>` s
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774888513` and verify success criteria are met.

**Last updated**: 2026-03-30T16:36:59Z

## Dependencies

- REQ-1774887470 (Vercel direct xAI API and Grok Imagine support) — provides the `/api/imagine` backend endpoint

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
