import '@testing-library/jest-dom/vitest';

// Node 22+ ships an experimental global `localStorage`/`sessionStorage` that
// throws/resolves to `undefined` unless `--localstorage-file` is passed.
// happy-dom's Window detects that property already exists on globalThis and
// skips installing its own in-memory Storage polyfill, so any code reading
// bare `localStorage` (not `window.localStorage`) breaks in tests. Replace
// it with a minimal in-memory Storage before any test module runs.
// See also vitest.config.ts's `poolOptions.forks.execArgv:
// ['--no-experimental-webstorage']`, which addresses the same root cause via
// a Node flag — this fallback exists in case that flag is ever dropped (WR-05).
function createMemoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => (store.has(key) ? (store.get(key) ?? null) : null),
        setItem: (key: string, value: string) => {
            store.set(key, String(value));
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
            return store.size;
        },
    };
}

for (const key of ['localStorage', 'sessionStorage'] as const) {
    // На части релизов Node 22.x доступ к глобальному localStorage/sessionStorage
    // синхронно бросает исключение (а не просто резолвится в undefined) — простая
    // проверка `!globalThis[key]` в этом случае падает и роняет весь test-run до
    // того, как успеет установиться fallback-полифилл, который этот блок и должен
    // предоставить.
    let existing: unknown;
    try {
        existing = globalThis[key];
    } catch {
        existing = undefined;
    }
    if (!existing) {
        Object.defineProperty(globalThis, key, {
            value: createMemoryStorage(),
            writable: true,
            configurable: true,
        });
    }
}
