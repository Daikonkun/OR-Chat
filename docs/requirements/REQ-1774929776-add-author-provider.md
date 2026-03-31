# add author provider

**ID**: REQ-1774929776  
**Status**: CODE_REVIEW  
**Priority**: MEDIUM  
**Created**: 2026-03-31T04:02:57Z  

## Description

add more model selection from OpenRouter, and for avoidance of a messy UI, add a selector or model author first, and then a secondary selector for models provided by that specific author. for xAI, maintain its current status of using direct API. initial author list is 'deepseek, xiaomi, minimax'

## Success Criteria

- [ ] A primary "Author" dropdown appears in the UI, listing at minimum: xAI, DeepSeek, Xiaomi, MiniMax.
- [ ] Selecting an author populates a secondary "Model" dropdown with only that author's models from OpenRouter.
- [ ] xAI models retain `uses_direct_api` behavior — selecting xAI as author loads its models via the existing direct-API path and the ⚡ badge still displays correctly.
- [ ] The `ALLOWED_AUTHORS` list in `api/models.js` is extended to include `xiaomi` and `minimax`, and the backend groups returned models by author.
- [ ] The two-tier selector UI is clean and non-cluttered, replacing or wrapping the current single `<select id="model-select">` without breaking existing chat, vision, or /imagine workflows.

## Technical Notes

**Backend (`api/models.js`)**:
- Extend `ALLOWED_AUTHORS` array from `['x-ai', 'deepseek']` to include `'xiaomi'` and `'minimax'`.
- Consider returning models grouped by author (e.g., `{ authors: { "x-ai": [...], "deepseek": [...], ... } }`) or keep the flat list and let the frontend group — current frontend already groups by `m.author` via `<optgroup>`.

**Frontend (`static/app.js` + `static/index.html`)**:
- Replace or augment the single `#model-select` with an `#author-select` dropdown and a dependent `#model-select`.
- On author change, filter the cached model list and rebuild the model dropdown options.
- Preserve `updateApiBadge()` and `modelMeta` behavior so chat, vision, and /imagine flows are unaffected.
- Persist last-selected author in `localStorage` for convenience.

**Styling (`static/style.css`)**:
- Style the new author selector inline with the existing controls in `<header .controls>`.

**Risks**:
- Must not break the xAI direct-API routing or the ⚡ badge logic that depends on `modelMeta[modelSelect.value].uses_direct_api`.
- OpenRouter model IDs use `author/model-name` format; ensure correct author extraction for new providers (xiaomi, minimax).


## Development Plan

1. **Extend backend model list** — In `api/models.js`, add `'xiaomi'` and `'minimax'` to the `ALLOWED_AUTHORS` array. Keep the flat response shape (the frontend already groups by `m.author`).
2. **Add author selector to HTML** — In `static/index.html`, insert an `<select id="author-select">` before `#model-select` inside `<header .controls>`. Pre-populate with static options: xAI, DeepSeek, Xiaomi, MiniMax (values matching OpenRouter author slugs: `x-ai`, `deepseek`, `xiaomi`, `minimax`).
3. **Wire two-tier selection logic** — In `static/app.js`:
   - Cache the full model list from `/api/models` on load.
   - On `#author-select` change, filter the cache by author and rebuild `#model-select` options.
   - Preserve `modelMeta`, `updateApiBadge()`, and the `⚡ xAI Direct` badge.
   - Persist last-selected author in `localStorage`.
   - Auto-select the first author on initial load (default to `x-ai` if available).
4. **Style the author selector** — In `static/style.css`, add styles for `#author-select` consistent with the existing `#model-select` styling inside `.controls`.
5. **Validate end-to-end** — Verify chat, vision upload, and `/imagine` still work; confirm xAI direct-API badge displays; confirm all four authors appear and filter correctly.

**Last updated**: 2026-03-31T04:05:00Z

## Dependencies

- REQ-1774855463 (x-ai-direct API — xAI must keep direct-API routing)
- REQ-1774887470 (Vercel direct xAI API — deployed author/model logic must stay compatible)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
