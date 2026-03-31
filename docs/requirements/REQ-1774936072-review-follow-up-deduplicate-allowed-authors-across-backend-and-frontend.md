# Review follow-up: deduplicate ALLOWED_AUTHORS across backend and frontend

**ID**: REQ-1774936072  
**Status**: IN_PROGRESS  
**Priority**: MEDIUM  
**Created**: 2026-03-31T05:47:52Z  

## Description

Source: code-review of REQ-1774929776. Severity: MEDIUM. Evidence: ALLOWED_AUTHORS is defined independently in api/models.js, api/chat.js, server.py, and static/index.html (hardcoded <option> tags). Adding a new author requires updating 4 files, and the chat.js copy was missed during initial implementation. Required outcome: consolidate the author list into a single source of truth — either a shared config consumed by both Vercel functions and server.py, or dynamically populate the frontend author dropdown from the API response's distinct authors.

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

(Add implementation notes here)


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774936072-review-follow-up-deduplicate-allowed-authors-across-backend-and-frontend.md`.
   - **Summary**: Source: code-review of REQ-1774929776. Severity: MEDIUM. Evidence: ALLOWED_AUTHO
   - **Key criteria**: - [ ] Criterion 1 - [ ] Criterion 2
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: (Add implementation notes here)
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774936072` and verify success criteria are met.

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
