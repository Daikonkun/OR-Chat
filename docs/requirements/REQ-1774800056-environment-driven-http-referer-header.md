# environment-driven HTTP-Referer header

**ID**: REQ-1774800056
**Status**: IN_PROGRESS  
**Priority**: MEDIUM
**Created**: 2026-03-29T16:00:56Z
Make HTTP-Referer and X-Title headers environment-driven so they reflect the actual deployment origin. Source: code-review. Severity: HIGH. Evidence: server.py hardcodes HTTP-Referer to localhost:8888 which misleads OpenRouter in production.

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

(Add implementation notes here)


## Development Plan

1. Review Description, Success Criteria, and Technical Notes in `docs/requirements/REQ-1774800056-environment-driven-http-referer-header.md`.
   - **Summary**: 
   - **Key criteria**: - [ ] Criterion 1 - [ ] Criterion 2
2. Analyse Technical Notes and identify implementation approach.
   - **Notes**: (Add implementation notes here)
3. Implement changes in the files/scripts referenced by the requirement spec.
4. Run `./scripts/regenerate-docs.sh` to update manifests and generated docs.
5. Validate with `./scripts/show-requirement.sh REQ-1774800056` and verify success criteria are met.

**Last updated**: 2026-03-29T16:23:36Z

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
