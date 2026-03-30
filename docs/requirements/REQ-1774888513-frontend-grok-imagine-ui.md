# Frontend Grok Imagine UI

**ID**: REQ-1774888513  
**Status**: CODE_REVIEW  
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

1. **Add `/imagine` command detection in `static/app.js`** — Intercept messages starting with `/imagine ` in the submit handler. Extract the prompt text and route to the imagine flow instead of chat.

2. **Add imagine API call and response rendering in `static/app.js`** — Create `generateImage(prompt)` function that POSTs to `/api/imagine`, shows a loading spinner in the chat, then renders the returned image URL inline as an `<img>` element.

3. **Add imagine UI controls in `static/index.html`** — Add an optional aspect ratio selector and a generate image button (🎨) next to the send button.

4. **Add imagine styles in `static/style.css`** — Style the generated image display, loading spinner, and imagine controls.

**Last updated**: 2026-03-30T16:38:00Z

## Dependencies

- REQ-1774887470 (Vercel direct xAI API and Grok Imagine support) — provides the `/api/imagine` backend endpoint

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
