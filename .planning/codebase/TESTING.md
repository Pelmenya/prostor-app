# Testing Patterns

**Analysis Date:** 2026-07-03

## Test Framework

**Runner:**

- Vitest 3.2.4
- Config: `vitest.config.ts`
- Environment: happy-dom (lightweight DOM emulation)
- Globals: true (no explicit import of describe/it/expect)

**Assertion Library:**

- Vitest built-in expect
- @testing-library/jest-dom for extended matchers

**Run Commands:**

```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (V8 provider)
```

**Test Execution:**

- Uses NODE_OPTIONS='--experimental-require-module' for ESM module support
- Pre-commit hook (via Husky) runs `vitest run --changed` on `src/` changes

## Test File Organization

**Location:**

- Co-located with source files, NOT in separate `__tests__` directory
- Naming: `kebab-case.test.ts(x)` next to `kebab-case.ts(x)`

**Example structure:**

```
src/entities/product/
├── api/
│   ├── product.api.ts
│   └── product.api.test.tsx       ← test next to implementation
├── index.ts
└── ...
```

**Coverage Configuration:**

- Provider: V8
- Include: `src/**/*.{ts,tsx}`
- Exclude: `src/**/*.test.{ts,tsx}`, `src/**/*.d.ts`, `src/app/**`
- Tests & app/ are not counted

## Test Structure

**Describe/It Pattern:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComponentName', () => {
    beforeEach(() => {
        // reset state before each test
    });

    describe('specific behavior', () => {
        it('does something specific', () => {
            expect(value).toBe(expected);
        });
    });
});
```

**Key points:**

- Use Russian descriptions (matching comments/commit language)
- Each `it()` tests one behavior
- `beforeEach()` / `afterEach()` for setup/cleanup
- `describe()` for grouping related tests

## Mocking

**Framework:** Vitest's `vi` object

**Module Mocking:**

```typescript
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({ get: mockGet }),
}));

vi.mock('@/features/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/features/auth')>();
    return {
        ...actual,
        webLogin: vi.fn().mockResolvedValue({ ... }),
    };
});
```

**Patterns:**

- Import mocks before test setup
- Use `vi.fn()` for spy functions
- Use `.mockReturnValue()`, `.mockResolvedValue()`, `.mockImplementation()` for behavior
- Clear mocks before each test: `vi.clearAllMocks()` in `beforeEach()`

**API Mocking — MSW (Mock Service Worker):**

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
    http.get('*/privacy-policy/current', () => {
        return HttpResponse.json(mockPolicy);
    }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override handler in specific test
server.use(
    http.get('*/privacy-policy/current', () => {
        return new HttpResponse(null, { status: 500 });
    }),
);
```

**What to Mock:**

- External modules (next/navigation, @tanstack/react-query providers)
- API calls (via MSW)
- Time-based functions (if needed — use `vi.useFakeTimers()`)
- Window APIs (navigator, localStorage)

**What NOT to Mock:**

- Pure utility functions (test the real logic)
- Helper libraries (clsx, tailwind-merge)
- Business-critical Zustand stores (test real store behavior)
- Validation (Zod schemas)

## Fixtures and Factories

**Test Data:**
Mock objects defined at top of test file:

```typescript
const mockProduct: TProduct = {
    id: 'prod-1',
    name: 'Аквафор DWM-101S',
    description: 'Фильтр обратного осмоса',
    attributes: [],
    salePrices: [mockSalePrice],
};

const mockService: TService = {
    id: 'svc-1',
    name: 'Установка DWM-101S',
    rateOfHours: 2,
    category: EServiceCategory.MONTAZH,
    salePrices: [...],
};
```

**Location:** Inside test file as module-level constants. Shared fixtures can live in `src/test/__mocks__/` if reused across multiple test files.

## Testing TanStack Query Hooks

**Setup:**

```typescript
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }, // disable retries in tests
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}
```

**Hook Testing:**

```typescript
describe('useProductSearchPaginated', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    it('disabled quando q shorter than 2 chars', () => {
        const { result } = renderHook(() => useProductSearchPaginated('a'), {
            wrapper: createWrapper(queryClient),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });
});
```

**Patterns:**

- Use `renderHook()` from @testing-library/react
- Pass `wrapper` prop with QueryClientProvider
- Set `retry: false` to avoid flaky tests
- Check `fetchStatus`, `isLoading`, `isError`, `data`, `hasNextPage`
- Use `waitFor()` for async state changes

## Testing Zustand Stores

**Setup:**

```typescript
describe('cart.store', () => {
    beforeEach(() => {
        useCartStore.setState({ items: {}, isGuest: true });
    });
});
```

**Testing Actions:**

```typescript
it('добавляет товар в пустую корзину', () => {
    useCartStore.getState().addProduct(mockProduct, 1, 1500000);

    const items = useCartStore.getState().items;
    expect(items['prod-1']).toBeDefined();
    expect(items['prod-1'].count).toBe(1);
});
```

**Testing Selectors (Pure Functions):**

```typescript
it('selectTotalPrice сумирует цены товаров и услуг', () => {
    const items = { ... };
    const total = selectTotalPrice(items);
    expect(total).toBe(expectedTotal);
});
```

**Patterns:**

- Reset state in `beforeEach()` via `setState()`
- Get current state via `getState()` for assertions
- Call actions directly on state
- Test selectors as pure functions (not via hook)
- Don't mock stores in other tests — use real behavior

## Testing React Components

**Setup:**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginPage', () => {
    it('рендерит поля email и пароль', () => {
        render(<LoginPage />);

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    });
});
```

**User Interactions:**

```typescript
it('показывает ошибки валидации при пустой отправке', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
        expect(screen.getByText('Введите email')).toBeInTheDocument();
    });
});
```

**Patterns:**

- Use `screen` to query elements (more accessible than `getByTestId`)
- Use semantic queries: `getByRole()`, `getByLabelText()`, `getByPlaceholderText()`
- Use `userEvent.setup()` for realistic user interactions
- Use `waitFor()` for async state/DOM updates
- Avoid testing implementation details (avoid `getByTestId` unless necessary)

**Async Testing:**

```typescript
it('обрабатывает ошибку сервера', async () => {
    server.use(
        http.get('*/privacy-policy/current', () => {
            return new HttpResponse(null, { status: 500 });
        }),
    );

    const { result } = renderHook(() => useCurrentPolicy(), {
        wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
});
```

## Error Testing

**Testing Error Handling:**

```typescript
describe('extractErrorMessage', () => {
    it('string message', () => {
        expect(extractErrorMessage({ message: 'error text' }, 'fallback')).toBe('error text');
    });

    it('array message — берёт первый', () => {
        expect(extractErrorMessage({ message: ['first', 'second'] }, 'fallback')).toBe('first');
    });

    it('пустой массив → fallback', () => {
        expect(extractErrorMessage({ message: [] }, 'fallback')).toBe('fallback');
    });

    it('null data → fallback', () => {
        expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
    });
});
```

**Patterns:**

- Test both success and error paths
- Test edge cases (empty arrays, null, undefined)
- Verify fallback behavior
- Test error message extraction for invalid shapes

## Pre-Commit Testing

**Husky Hook** at `.husky/pre-commit`:

```bash
npx lint-staged
npx steiger ./src
npx tsc --noEmit
npx vitest run --changed
```

**Stages:**

1. Run Prettier + ESLint on staged files
2. Validate FSD structure
3. Type check
4. Run changed tests

If any step fails, commit is blocked. Fix issues and re-commit.

## Coverage Requirements

**Target:** No explicit coverage threshold enforced, but high coverage is expected

**View Coverage:**

```bash
npm run test:coverage
# Opens coverage report in .coverage/ directory
```

**Strategy:**

- Aim for 80%+ coverage on critical paths (API, stores, utilities)
- 100% coverage on pure functions (selectors, formatters, validators)
- Lower for UI rendering (focus on behavior, not implementation)
- Test error paths and edge cases

## Common Test Patterns

### Testing Validation (Zod Schema)

```typescript
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

describe('userSchema', () => {
    it('validates correct user', () => {
        const result = userSchema.safeParse({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
        const result = userSchema.safeParse({
            email: 'not-an-email',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });
});
```

### Testing Form Submission

```typescript
it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
    });
});
```

### Testing Conditional Rendering

```typescript
it('shows spinner when loading', () => {
    render(<Component isLoading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
});

it('shows content when loaded', () => {
    render(<Component isLoading={false} data={mockData} />);
    expect(screen.getByText(mockData.title)).toBeInTheDocument();
});
```

### Testing Custom Hooks

```typescript
it('useCartHydrated returns false before hydration', () => {
    const { result } = renderHook(() => useCartHydrated());
    expect(result.current).toBe(false);
});

it('useCartHydrated returns true after hydration', async () => {
    const { result } = renderHook(() => useCartHydrated());

    await waitFor(() => {
        expect(result.current).toBe(true);
    });
});
```

## MSW Setup

**Global MSW Server (if using across many tests):**
Consider adding to `src/test/setup.ts` if MSW handlers are shared:

```typescript
import { setupServer } from 'msw/node';

export const server = setupServer();
// ... handlers

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Test-Specific Handlers:**
Define within each test file for isolated behavior.

## Performance Considerations

**Test Optimization:**

- Keep tests fast: <100ms per test ideal, <500ms acceptable
- Mock expensive operations (API calls, file I/O)
- Avoid unnecessary renders in component tests
- Use `vi.useFakeTimers()` for time-dependent tests

**Debug Slow Tests:**

```bash
npm run test:watch
# Press 't' to run specific test file
```

---

_Testing analysis: 2026-07-03_
