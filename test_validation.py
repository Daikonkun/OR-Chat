#!/usr/bin/env python3
"""Tests for xAI API key validation and login rate limiting."""

import sys
import os
import time
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


def test_rate_limit():
    """Test login rate limiting on the FastAPI endpoint."""
    # Set APP_PASSWORD so auth is enabled
    os.environ['APP_PASSWORD'] = 'test-secret-password'
    # Use a short window for testing
    os.environ['RATE_LIMIT_MAX_ATTEMPTS'] = '5'
    os.environ['RATE_LIMIT_WINDOW_SECONDS'] = '900'

    # Re-import after setting env vars
    import importlib
    import server as srv
    importlib.reload(srv)

    from fastapi.testclient import TestClient
    client = TestClient(srv.app)

    all_passed = True

    print('\nTesting login rate limiting:')
    print('=' * 60)

    # Clear any existing rate-limit state
    srv._login_attempts.clear()

    # 1. First 5 failed attempts should return 401
    for i in range(1, 6):
        resp = client.post('/api/login', json={'password': 'wrong'})
        passed = resp.status_code == 401
        all_passed = all_passed and passed
        status = '✓' if passed else '✗'
        print(f'{status} Failed attempt {i}: status {resp.status_code} (expected 401)')

    # 2. 6th failed attempt should return 429
    resp = client.post('/api/login', json={'password': 'wrong'})
    passed = resp.status_code == 429
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} 6th attempt rate-limited: status {resp.status_code} (expected 429)')

    # 3. 429 response should have Retry-After header
    retry_after = resp.headers.get('retry-after')
    passed = retry_after is not None and int(retry_after) > 0
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} Retry-After header present: {retry_after}')

    # 4. Even correct password should be blocked while rate-limited
    resp = client.post('/api/login', json={'password': 'test-secret-password'})
    passed = resp.status_code == 429
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} Correct password blocked while rate-limited: status {resp.status_code} (expected 429)')

    # 5. Clear state and test that successful login resets the counter
    srv._login_attempts.clear()
    # Make 3 failed attempts
    for _ in range(3):
        client.post('/api/login', json={'password': 'wrong'})

    # Successful login should clear the counter
    resp = client.post('/api/login', json={'password': 'test-secret-password'})
    passed = resp.status_code == 200
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} Successful login after 3 failures: status {resp.status_code} (expected 200)')

    # After success, counter should be reset — 5 more failures before 429
    for i in range(1, 6):
        resp = client.post('/api/login', json={'password': 'wrong'})
        passed = resp.status_code == 401
        all_passed = all_passed and passed
    resp = client.post('/api/login', json={'password': 'wrong'})
    passed = resp.status_code == 429
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} Counter reset after success: 6th new failure got {resp.status_code} (expected 429)')

    # 6. Test window expiry: manually expire the window
    srv._login_attempts.clear()
    # Manually insert an expired record
    expired_time = time.time() - 901  # 901 seconds ago, window is 900s
    srv._login_attempts['testclient'] = (10, expired_time)
    resp = client.post('/api/login', json={'password': 'wrong'})
    passed = resp.status_code == 401  # Should be allowed (window expired), not 429
    all_passed = all_passed and passed
    status = '✓' if passed else '✗'
    print(f'{status} Expired window allows retry: status {resp.status_code} (expected 401)')

    print('=' * 60)
    print(f'Rate-limit: {"All tests passed" if all_passed else "Some tests failed"}')

    # Clean up env
    del os.environ['APP_PASSWORD']
    del os.environ['RATE_LIMIT_MAX_ATTEMPTS']
    del os.environ['RATE_LIMIT_WINDOW_SECONDS']

    return all_passed

if __name__ == '__main__':
    success = test_validation()
    success = test_rate_limit() and success
    sys.exit(0 if success else 1)