# Review follow-up: add xAI API key format validation

**ID**: REQ-1774858263  
**Status**: IN_PROGRESS  
**Priority**: HIGH  
**Created**: 2026-03-30T08:11:03Z  

## Description

Source: code-review of REQ-1774855463. Severity: HIGH. Evidence: XAI_API_KEY used without validation; invalid keys only fail on API call. xAI keys typically have specific format (e.g., starting with 'xai-'). Required outcome: add format validation for XAI_API_KEY to catch obvious errors early and provide clear error messages.

## Success Criteria

- [ ] XAI_API_KEY format validation function implemented in `server.py`
- [ ] Validation catches obviously invalid keys (wrong format, missing prefix, etc.)
- [ ] Clear error messages provided for invalid keys
- [ ] Backward compatibility maintained for existing valid keys
- [ ] Documentation updated with key format expectations

## Technical Notes

**Current issue**: XAI_API_KEY is used without validation in `server.py`. Invalid keys only fail when making actual API calls to xAI/OpenRouter, providing poor user experience.

**Proposed solution**: Add format validation for XAI_API_KEY similar to how XAI_BASE URL is validated. xAI keys typically follow specific patterns (e.g., starting with 'xai-', specific length, character set).

**Implementation approach**:
1. Research actual xAI API key format from xAI documentation
2. Create validation function that checks key format
3. Integrate validation at key usage points
4. Provide clear error messages for invalid keys
5. Maintain backward compatibility

**Files to modify**:
- `server.py`: Add validation function and integrate at XAI_API_KEY usage points
- `.env.example`: Add format hint in comments
- Documentation updates as needed


## Development Plan

1. **Research xAI API key format**: Investigate actual xAI API key patterns (check documentation, examples) to determine proper validation rules
   - **Files**: Research external xAI documentation
   - **Expected outcome**: Document key format pattern (e.g., starts with 'xai-', length requirements, character set)

2. **Add validation function in server.py**: Create a validation function for XAI_API_KEY that checks format before use
   - **Files**: `server.py`
   - **Expected outcome**: Add `validate_xai_api_key(key)` function that returns boolean or raises informative error

3. **Integrate validation into existing code**: Update XAI_API_KEY usage points to validate before API calls
   - **Files**: `server.py` (lines 20, 79, 115, 120)
   - **Expected outcome**: Early validation with clear error messages instead of failing on API call

4. **Update documentation**: Add validation details to relevant documentation
   - **Files**: `.env.example`, any API documentation
   - **Expected outcome**: Clear guidance on expected xAI API key format

5. **Test validation**: Create test cases for valid and invalid key formats
   - **Files**: Test in development environment
   - **Expected outcome**: Confirm validation catches obvious errors and allows valid keys

**Last updated**: 2026-03-30T09:39:58Z

## Dependencies

(List other requirement IDs if applicable, e.g., REQ-XXX, REQ-YYY)

## Worktree

(Will be populated when work starts: feature/REQ-ID-slug)

---

* **Linked Worktree**: None yet
* **Branch**: None yet
* **Merged**: No
* **Deployed**: No
