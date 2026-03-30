#!/usr/bin/env python3
"""Test xAI API key validation function."""

import sys
sys.path.insert(0, '.')

from server import validate_xai_api_key

def test_validation():
    """Test the validate_xai_api_key function with various test cases."""
    
    test_cases = [
        # (key, expected_result, description)
        ('', False, 'Empty string'),
        ('xai-', False, 'Just prefix'),
        ('xai-test', True, 'Valid simple key'),
        ('xai-test-123', True, 'Valid key with numbers and hyphens'),
        ('xai-test_123', False, 'Invalid character underscore'),
        ('xai-abc', False, 'Too short after prefix'),
        ('xai-abcdef', True, 'Valid length'),
        ('notxai-123', False, 'Wrong prefix'),
        ('XAI-test', False, 'Wrong case prefix'),
        ('xai-123-abc-def-456', True, 'Long valid key'),
        ('xai-123abc', True, 'Valid alphanumeric'),
        ('xai-123-abc', True, 'Valid with hyphens'),
        ('xai-123_abc', False, 'Invalid underscore'),
        ('xai-123.abc', False, 'Invalid dot'),
        ('xai-123 abc', False, 'Invalid space'),
    ]
    
    print('Testing xAI API key validation:')
    print('=' * 60)
    
    all_passed = True
    for key, expected, description in test_cases:
        result = validate_xai_api_key(key)
        passed = result == expected
        all_passed = all_passed and passed
        status = '✓' if passed else '✗'
        print(f'{status} {description:30} {key:25} -> {result} (expected {expected})')
    
    print('=' * 60)
    print(f'Overall: {"All tests passed" if all_passed else "Some tests failed"}')
    
    return all_passed

if __name__ == '__main__':
    success = test_validation()
    sys.exit(0 if success else 1)