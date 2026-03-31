# Review follow-up: deduplicate ALLOWED_AUTHORS across backend and frontend

**ID**: REQ-1774936072  
**Status**: MERGED  
**Priority**: MEDIUM  
**Created**: 2026-03-31T05:47:52Z  

## Description

Source: code-review of REQ-1774929776. Severity: MEDIUM. Evidence: ALLOWED_AUTHORS is defined independently in api/models.js, api/chat.js, server.py, and static/index.html (hardcoded <option> tags). Adding a new author requires updating 4 files, and the chat.js copy was missed during initial implementation. Required outcome: consolidate the author list into a single source of truth — either a shared config consumed by both Vercel functions and server.py, or dynamically populate the frontend author dropdown from the API response's distinct authors.

## Success Criteria

- [x] A single `allowed-authors.json` config file is the sole source of truth for the author list
- [x] `api/models.js`, `api/chat.js`, and `server.py` all read from the shared config instead of hardcoding `ALLOWED_AUTHORS`
- [x] The frontend author dropdown in `static/index.html` is populated dynamically from the `/api/models` response (no hardcoded `<option>` tags)
- [x] Adding or removing an author requires editing only `allowed-authors.json`

## Technical Notes

- Current duplication: `ALLOWED_AUTHORS` defined in `api/models.js:5`, `api/chat.js:4`, `server.py:78`, and hardcoded `<option>` tags in `static/index.html:20-25`.
- Approach: create `allowed-authors.json` (array of `{"id": "x-ai", "label": "xAI"}` objects). Backend JS files import it; `server.py` loads it at startup. Frontend builds `<option>` elements from the API response's distinct authors.
- The `/api/models` endpoint already returns author info per model; the frontend can extract unique authors from that.


## Development Plan

1. **Create `allowed-authors.json`** — Add a shared config file at repo root with `[{"id": "x-ai", "label": "xAI"}, {"id": "deepseek", "label": "DeepSeek"}, {"id": "xiaomi", "label": "Xiaomi"}, {"id": "minimax", "label": "MiniMax"}]`.
2. **Update `api/models.js` and `api/chat.js`** — Replace the hardcoded `ALLOWED_AUTHORS` arrays with `require('../allowed-authors.json').map(a => a.id)`. Remove duplicated constant.
3. **Update `server.py`** — Load `allowed-authors.json` at startup via `json.load()` and build the `ALLOWED_AUTHORS` set from it.
4. **Update frontend (`static/index.html` + `static/app.js`)** — Remove hardcoded `<option>` tags from `index.html`. In `app.js`, after fetching `/api/models`, extract distinct authors from the response and dynamically populate the `<select id="author-select">` dropdown.
5. **Validate** — Run `python server.py` locally; verify author dropdown populates dynamically and model filtering still works. Run `./scripts/regenerate-docs.sh` to update docs.

**Last updated**: 2026-03-31T06:16:29Z

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
