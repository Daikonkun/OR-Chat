# add author provider

**ID**: REQ-1774929776  
**Status**: IN_PROGRESS  
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

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774929776-add-author-provider.md`.
   - **Summary**: add more model selection from OpenRouter, and for avoidance of a messy UI, add a
   - **Key criteria**: - [ ] A primary "Author" dropdown appears in the UI, listing at minimum: xAI, DeepSeek, Xiaomi, Mini
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: **Backend (`api/models.js`)**:
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774929776` and verify success criteria are met.

**Last updated**: 2026-03-31T04:04:29Z

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
