# Review follow-up: proper base64 validation for image rendering

**ID**: REQ-1774855194  
**Status**: MERGED  
**Priority**: HIGH  
**Created**: 2026-03-30T07:19:54Z  

## Description

Source: code-review of REQ-1774851880. Severity: HIGH. Evidence: base64 regex in static/app.js doesn't validate proper base64 structure (length divisible by 4, valid characters only). Invalid base64 could cause rendering errors or security issues. Required outcome: implement proper base64 validation with length and character checks.

## Success Criteria

- [x] `isAllowedImageUrl()` validates that the base64 payload in data: URLs contains only valid base64 characters (`A-Za-z0-9+/=`)
- [x] Base64 payload length is checked to be divisible by 4
- [x] `addImageFile()` validates the extracted base64 string before pushing to `pendingImages`
- [x] Invalid base64 data is rejected with a user-facing message or blocked rendering

## Technical Notes

- `static/app.js` line ~191: `isAllowedImageUrl()` accepts any `data:image/*;base64,` URL without validating the payload after the comma
- `static/app.js` line ~302: `addImageFile()` splits the data URL and pushes `base64` without validation
- Add a helper function `isValidBase64(str)` that checks: (1) only `[A-Za-z0-9+/=]` characters, (2) length divisible by 4, (3) non-empty
- Call the helper in both `isAllowedImageUrl()` (for assistant-rendered images) and `addImageFile()` (for user uploads)


## Development Plan

1. **Add `isValidBase64(str)` helper** in `static/app.js` — validates character set (`[A-Za-z0-9+/=]` only), non-empty, and length divisible by 4.
2. **Integrate into `isAllowedImageUrl()`** — after matching the `data:image/*;base64,` prefix, extract the payload and call `isValidBase64()`. Return false if invalid.
3. **Integrate into `addImageFile()`** — after splitting the data URL, validate the base64 portion. Alert the user and skip the image if invalid.
4. **Run `./scripts/regenerate-docs.sh`** to update manifests and generated docs.
5. **Verify** with `./scripts/show-requirement.sh REQ-1774855194` and confirm all success criteria are met.

**Last updated**: 2026-03-30T15:33:32Z

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
