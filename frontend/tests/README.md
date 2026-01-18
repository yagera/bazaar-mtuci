# Frontend Tests

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

- `setup.ts` - Test setup and mocks
- `utils/test-utils.tsx` - Testing utilities and providers
- `lib/` - Tests for library functions
- `components/` - Tests for React components

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/tests/utils/test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Coverage

Target coverage: 70%+

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

