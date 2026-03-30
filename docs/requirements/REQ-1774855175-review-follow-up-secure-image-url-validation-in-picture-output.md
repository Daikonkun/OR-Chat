# Review follow-up: secure image URL validation in picture output

**ID**: REQ-1774855175  
**Status**: CODE_REVIEW  
**Priority**: HIGH  
**Created**: 2026-03-30T07:19:35Z  

## Description

Source: code-review of REQ-1774851880. Severity: HIGH. Evidence: image URL regex in static/app.js is overly permissive (matches any URL ending with image extensions without proper validation). Could match non-image URLs or malicious content. Required outcome: implement proper URL validation with safety checks before rendering images.

## Success Criteria

- [x] Image URLs rendered in assistant messages are validated against an allowlist of safe schemes (`https:` only) and known image-hosting domains or safe URL patterns before being inserted into the DOM.
- [x] URLs that fail validation are not rendered as `<img>` elements; instead, they are displayed as plain-text links or omitted with a warning.
- [x] A dedicated `isAllowedImageUrl(url)` function exists in `static/app.js` encapsulating all validation logic, making it testable and auditable.
- [x] No user-supplied or LLM-returned URL can trigger script execution (XSS) via the image rendering path (e.g., `javascript:`, `data:text/html`, SVG with inline scripts).
- [x] Existing user-uploaded image previews (data URLs from FileReader) continue to work without regression.

## Technical Notes

**Root cause**: The picture-output feature (REQ-1774851880) renders LLM-returned image URLs directly into `<img src="...">` without validating the URL. An attacker-controlled model response could inject malicious URLs.

**Approach**:
1. Create `isAllowedImageUrl(url)` in `static/app.js` that:
   - Parses the URL with the `URL` constructor (catches malformed URLs).
   - Rejects any scheme other than `https:`.
   - Optionally allowlists known image CDN domains (e.g., `i.imgur.com`, `*.openai.com`).
   - Rejects `data:` URLs except `data:image/(png|jpeg|gif|webp);base64,…` which are used for user uploads.
2. Apply `isAllowedImageUrl()` wherever LLM-returned image URLs are rendered.
3. Sanitise the `alt` attribute to prevent attribute-injection.

**Affected files**: `static/app.js` (primary), `static/index.html` (if image elements are templated there).


## Development Plan

1. **Add `isAllowedImageUrl()` function** in `static/app.js` — parse URL with the `URL` constructor, enforce `https:` scheme, reject `javascript:` / `data:text/*` schemes, and allowlist `data:image/*;base64,` for user uploads.
2. **Guard all LLM-returned image rendering** — locate every code path in `static/app.js` where assistant-message image URLs are inserted into the DOM and gate them through `isAllowedImageUrl()`. Display rejected URLs as escaped plain text with a warning class.
3. **Sanitise image `alt` attributes** — ensure any `alt` text derived from LLM output is escaped via `escapeHtml()` to prevent attribute injection.
4. **Verify user-upload path is unaffected** — confirm that `renderImagePreview()` and `renderUserMessage()` still work with `data:image/*` URLs from the FileReader path.
5. **Run `./scripts/regenerate-docs.sh`** and validate with `./scripts/show-requirement.sh REQ-1774855175`.

**Last updated**: 2026-03-30T10:15:57Z

## Dependencies

- REQ-1774851880: Allow picture output (parent feature — this requirement secures its image rendering)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
