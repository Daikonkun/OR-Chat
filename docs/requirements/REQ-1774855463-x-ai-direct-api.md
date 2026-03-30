# x-ai-direct api

**ID**: REQ-1774855463  
**Status**: IN_PROGRESS  
**Priority**: MEDIUM  
**Created**: 2026-03-30T07:24:23Z  

## Description

add support for direct API key import from xAI, note to differentiate on the UI to distinguish direct API vs OpenRouter API

## Success Criteria

- [ ] Users can input and save a direct xAI API key separately from the OpenRouter API key in the configuration.
- [ ] The UI clearly indicates whether the system is using direct xAI API or OpenRouter API (via visual indicators, labels, or toggles).
- [ ] When direct xAI API is configured, chat requests to xAI models use the direct API endpoint instead of routing through OpenRouter.
- [ ] The system gracefully handles API key validation and provides clear error messages for invalid or expired xAI API keys.
- [ ] Configuration persists between sessions and users can switch between direct xAI API and OpenRouter API modes.

## Technical Notes

**Approach**: Add xAI API key configuration to `.env` file and environment variables. Update backend (`server.py`) to detect xAI models and use direct API when xAI key is present. Modify frontend (`static/app.js`, `static/index.html`) to show API source indicator.

**Affected Areas**:
- `.env` / `.env.example`: Add `XAI_API_KEY` environment variable
- `server.py`: Modify chat endpoint to route xAI models to direct API when key is available
- `static/app.js`: Add UI logic to display API source indicator
- `static/index.html`: Add visual elements for API source differentiation
- Configuration management: Handle dual API key setup

**Risks**: Need to maintain compatibility with existing OpenRouter flow. Direct xAI API might have different rate limits, response formats, or features than OpenRouter. Security considerations for storing additional API key.


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774855463-x-ai-direct-api.md`.
   - **Summary**: add support for direct API key import from xAI, note to differentiate on the UI 
   - **Key criteria**: - [ ] Users can input and save a direct xAI API key separately from the OpenRouter API key in the co
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: **Approach**: Add xAI API key configuration to `.env` file and environment variables. Update backend
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774855463` and verify success criteria are met.

**Last updated**: 2026-03-30T07:28:30Z

## Dependencies

None

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
