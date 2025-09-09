# Test Suite Documentation

## Overview

This test suite provides comprehensive validation of the CodeStats API integration and ensures regression-proof functionality.

## Test Structure

### 1. Mock Data (`mocks/codestats-api.mock.js`)

Provides realistic mock data based on the actual CodeStats API structure:

- **`mockResponses`**: Various user scenarios (beginner, expert, empty user, etc.)
- **`errorResponses`**: Error scenarios (404, 500, malformed JSON, network errors)
- **`mockFetch`**: Mock fetch implementation that returns different responses based on username

### 2. API Validation Tests (`api-validation.test.js`)

Comprehensive tests covering:

- **API Response Structure Validation**: Ensures all required fields are present
- **API Usage Correctness**: Validates correct API endpoints and error handling
- **Language Data Processing**: Tests sorting, limiting, and edge cases
- **Environment Variable Validation**: Tests configuration handling
- **Malformed Response Handling**: Tests robustness against invalid data

### 3. Integration Tests (`index.test.js`)

Extended with end-to-end mock integration:

- **Complete Workflow Testing**: Full process from API call to file update
- **Chart Generation**: Tests with real API structure
- **README Replacement**: Tests complete content replacement workflow
- **Multi-scenario Testing**: Tests different user types and edge cases

## Mock Data Scenarios

### User Types

1. **`testuser`** - Standard user with multiple languages
2. **`newuser`** - Empty user with no languages
3. **`singleuser`** - User with only one language
4. **`polyglot`** - User with many languages (tests 6-language limit)
5. **`beginner`** - User with very low XP values
6. **`expert`** - User with very high XP values

### Error Scenarios

1. **`notfound`** - Returns 404 Not Found
2. **`servererror`** - Returns 500 Internal Server Error
3. **`malformed`** - Returns malformed JSON
4. **`networkerror`** - Throws network error

## API Structure Validation

The tests validate that the API response matches this structure:

```javascript
{
  "user": "username",
  "languages": {
    "JavaScript": {
      "xps": 188377,
      "new_xps": 0
    }
    // ... more languages
  },
  "dates": {
    "2024-01-01": 1234
    // ... more dates
  },
  "machines": {
    "machine-name": {
      "xps": 12345,
      "new_xps": 0
    }
  },
  "total_xp": 123456,
  "new_xp": 15
}
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test api-validation.test.js

# Run in watch mode
pnpm test --watch
```

## Test Coverage

The test suite covers:

- ✅ API endpoint correctness
- ✅ Response structure validation  
- ✅ Error handling (404, 500, network errors)
- ✅ Data processing and chart generation
- ✅ Language sorting and limiting
- ✅ Edge cases (empty data, extreme values)
- ✅ Environment variable handling
- ✅ README content replacement
- ✅ End-to-end workflow

## Regression Protection

The tests protect against:

- API response structure changes
- Data processing logic errors
- Chart generation format changes
- Error handling regressions
- Environment variable parsing issues
- File operation errors

## Adding New Tests

1. **API Changes**: Update `codestats-api.mock.js` with new response structure
2. **New Features**: Add corresponding tests to `api-validation.test.js`
3. **Integration**: Extend `index.test.js` with new end-to-end scenarios

## Mock vs. Real API

Tests use mock data by default for:
- Fast execution
- Consistent results
- Testing error scenarios
- Offline development

For manual verification with real API:
```javascript
// Temporarily replace mockFetch with real fetch
global.fetch = fetch
```
