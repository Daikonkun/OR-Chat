# x-ai-direct api

**ID**: REQ-1774855463  
**Status**: CODE_REVIEW  
**Priority**: MEDIUM  
**Created**: 2026-03-30T07:24:23Z  

## Description

add support for direct API key import from xAI, note to differentiate on the UI to distinguish direct API vs OpenRouter API

## Success Criteria

- [x] Users can input and save a direct xAI API key separately from the OpenRouter API key in the configuration.
- [x] The UI clearly indicates whether the system is using direct xAI API or OpenRouter API (via visual indicators, labels, or toggles).
- [x] When direct xAI API is configured, chat requests to xAI models use the direct API endpoint instead of routing through OpenRouter.
- [x] The system gracefully handles API key validation and provides clear error messages for invalid or expired xAI API keys.
- [x] Configuration persists between sessions and users can switch between direct xAI API and OpenRouter API modes.

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

1. **Add XAI_API_KEY environment variable support**
   - Update `.env.example` to include `XAI_API_KEY=` placeholder
   - Update documentation to explain dual API key configuration
   - Test environment variable loading in Python

2. **Modify backend to support direct xAI API routing**
   - Update `server.py` to check for `XAI_API_KEY` environment variable
   - Modify chat endpoint to route xAI model requests to direct API when key is available
   - Implement fallback to OpenRouter when xAI key is not configured
   - Handle potential differences in API response formats between xAI and OpenRouter

3. **Add UI indicators for API source differentiation**
   - Update `static/index.html` to add visual indicator (badge, icon, or label) for API source
   - Modify `static/app.js` to display current API source (xAI direct vs OpenRouter)
   - Ensure UI updates dynamically based on configured API and selected model

4. **Implement API key configuration interface**
   - Add xAI API key input field to UI (could be in settings panel or main interface)
   - Update `static/app.js` to save/load xAI API key from localStorage or backend
   - Add validation for xAI API key format
   - Implement clear visual feedback for API key status (valid, invalid, not configured)

5. **Test and validate implementation**
   - Test with valid xAI API key to verify direct API routing works
   - Test without xAI API key to ensure OpenRouter fallback works
   - Verify UI correctly indicates API source for different scenarios
   - Test configuration persistence across browser sessions
   - Validate all success criteria are met

**Last updated**: 2026-03-30T07:28:30Z

## Dependencies

- REQ-1774858151: Review follow-up: verify and configure xAI API endpoint
- REQ-1774858263: Review follow-up: add xAI API key format validation

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
