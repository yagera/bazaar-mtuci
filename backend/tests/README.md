# Backend Tests

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::TestAuth::test_login_success

# Run with markers
pytest -m auth
pytest -m integration
```

## Test Structure

- `conftest.py` - Shared fixtures and test configuration
- `test_auth.py` - Authentication endpoints tests
- `test_items.py` - Items endpoints tests
- `test_bookings.py` - Bookings endpoints tests
- `test_moderation.py` - Moderation endpoints tests
- `test_business_logic.py` - Business logic unit tests

## Test Markers

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.items` - Items tests
- `@pytest.mark.bookings` - Bookings tests
- `@pytest.mark.moderation` - Moderation tests

## Coverage

Target coverage: 70%+

View coverage report:
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

