---
phase: 02-email-registration-verification-login
reviewed: 2026-07-04T07:53:13Z
depth: standard
files_reviewed: 16
files_reviewed_list:
    - src/app/(web)/layout.tsx
    - src/features/auth/index.ts
    - src/features/auth/ui/registration-notice-listener/index.ts
    - src/features/auth/ui/registration-notice-listener/registration-notice-listener.test.tsx
    - src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx
    - src/shared/ui/icons/index.ts
    - src/shared/ui/icons/telegram-icon.tsx
    - src/shared/ui/index.ts
    - src/views/auth/ui/login-page.test.tsx
    - src/views/auth/ui/login-page.tsx
    - src/views/auth/ui/register-page.test.tsx
    - src/views/auth/ui/register-page.tsx
    - src/views/auth/ui/verify-email-page.test.tsx
    - src/views/auth/ui/verify-email-page.tsx
    - src/views/profile/ui/profile-page.test.tsx
    - src/views/profile/ui/profile-page.tsx
findings:
    critical: 1
    warning: 3
    info: 1
    total: 5
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-04T07:53:13Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the email registration/verification/login phase: `login-page.tsx`, `register-page.tsx`,
`verify-email-page.tsx`, `profile-page.tsx`, the new `RegistrationNoticeListener`, and their tests.

The LOGIN-02 requirement (never leak backend 401 details) is verified correct — `login-page.tsx`
renders a hardcoded locked string for any `ApiError` and never touches `err.data.message`, and
both `LOGIN-02` tests (with and without a `message` field on the 401 body) pass this check. The
two documented executor deviations (sessionStorage.clear() in login/register test `beforeEach`,
`useIsClient`/`useSyncExternalStore` in `RegistrationNoticeListener`) are present and correctly
implemented, matching the existing `PushPromoBanner` idiom.

However, one Blocker and three Warnings were found:

1. `RegistrationNoticeListener` reads/writes `sessionStorage` directly in the render body and in
   `dismiss()` with **no try/catch**, despite this component being mounted unconditionally in
   `(web)/layout.tsx` (i.e. on every page) and despite this exact bug class (synchronous throw on
   storage access) having already been hit and fixed elsewhere in this codebase per the WR-05 note
   referenced in the phase SUMMARY. There is no `error.tsx`/`global-error.tsx` anywhere under
   `src/app`, so an uncaught throw here has no boundary to stop it from taking down the entire web
   app shell.
2. `login-page.tsx` collapses **every** `ApiError` (not just 401) into the generic locked string,
   so legitimate 429/500/network-shaped `ApiError`s are misreported to the user as "wrong
   email/password".
3. `ProfilePage` has no auth guard: an unauthenticated visitor to `/profile` gets a permanently
   blank page (no redirect, no message) — there is no `middleware.ts` and `app/(web)/profile/page.tsx`
   is a bare passthrough, so nothing upstream compensates for this.
4. The `reg-notice-pending` sessionStorage key is duplicated as a raw string literal between
   `register-page.tsx` (writer) and `registration-notice-listener.tsx` (reader, as `FLAG_KEY`) with
   no shared constant and no test asserting the write side actually sets it.

## Critical Issues

### CR-01: Unguarded sessionStorage access in a globally-mounted component can crash the entire app

**File:** `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx:26,31`

**Issue:** `RegistrationNoticeListener` is mounted unconditionally in `src/app/(web)/layout.tsx:14`,
meaning it renders on every single page in the `(web)` layout group. Its render body reads
`sessionStorage.getItem(FLAG_KEY)` directly (line 26) and `dismiss()` calls
`sessionStorage.removeItem(FLAG_KEY)` (line 31) with no `try/catch`. Any environment where
`sessionStorage` access throws synchronously (blocked storage in embedded webviews, some Safari
ITP/private-mode configurations, enterprise policies disabling Web Storage, sandboxed iframes) will
throw during render.

There is no error boundary anywhere in the app to contain the blast radius —
`command find src/app -iname "error.tsx" -o -iname "global-error.tsx"` returns nothing. An
uncaught render error here propagates past `Header`/`main`/`Footer` in the same layout tree,
taking down the whole page shell for every route under `(web)`, not just the auth pages.

This is the same bug class already identified and fixed once in this codebase (WR-05, referenced
in the phase SUMMARY: "storage-полифилл guard переживает синхронный throw при доступе" for
`getFormDraft`/`useFormDraft`), which already wrap their `sessionStorage` calls in `try/catch`
(see `src/shared/lib/hooks/use-form-draft.ts:12-17,52-56`). This new component reintroduces the
same unguarded pattern.

**Fix:**

```tsx
function readFlag(): boolean {
    try {
        return sessionStorage.getItem(FLAG_KEY) === '1';
    } catch {
        return false;
    }
}

function dismiss() {
    try {
        sessionStorage.removeItem(FLAG_KEY);
    } catch {
        // тихо игнорируем — недоступность storage не должна ронять layout
    }
    setDismissed(true);
}

// ...
const visible = readFlag();
```

## Warnings

### WR-01: LOGIN-02 error handling collapses all ApiError statuses, not just 401

**File:** `src/views/auth/ui/login-page.tsx:41-49`

**Issue:**

```tsx
} catch (err) {
    if (err instanceof ApiError) {
        setServerError('Неверная почта или пароль');
    } else {
        setServerError('Ошибка сети');
    }
}
```

The generic locked string is correct for 401 (that's the actual LOGIN-02/OWASP A07 requirement),
but this branch fires for **any** `ApiError`, regardless of `err.status`. A 429 (rate limited), a
500 (server error), or a validation 400 from `/auth/web/login` would all be misreported to the
user as "wrong email or password" — actively misleading for statuses that have nothing to do with
credential correctness. There's no test exercising a non-401 `ApiError` to catch this.

**Fix:**

```tsx
} catch (err) {
    if (err instanceof ApiError && err.status === 401) {
        // OWASP A07: единое сообщение независимо от причины 401
        setServerError('Неверная почта или пароль');
    } else if (err instanceof ApiError) {
        setServerError('Не удалось войти. Попробуйте позже.');
    } else {
        setServerError('Ошибка сети');
    }
}
```

### WR-02: ProfilePage has no redirect/guard for unauthenticated users

**File:** `src/views/profile/ui/profile-page.tsx:17`

**Issue:** `if (!mounted || !user) return null;` silently renders nothing — no redirect to
`/login`, no message — when an unauthenticated visitor lands on `/profile`. There is no
`middleware.ts` in the repo and `src/app/(web)/profile/page.tsx` is a bare
`return <ProfilePage />;` passthrough with no guard, so nothing upstream compensates. The result is
a permanently blank page (inside Header/Footer chrome) for any logged-out user who navigates to or
bookmarks `/profile`, with no way to discover they need to log in.

**Fix:** Redirect unauthenticated users to `/login?from=/profile` (mirroring the `getSafeRedirect`
pattern already used by `login-page.tsx`/`register-page.tsx`):

```tsx
const router = useRouter();
useEffect(() => {
    if (mounted && !user) router.replace('/login?from=%2Fprofile');
}, [mounted, user, router]);

if (!mounted || !user) return null;
```

### WR-03: `reg-notice-pending` sessionStorage key duplicated as an untyped string literal, unverified by tests

**File:** `src/views/auth/ui/register-page.tsx:165`, `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx:6`

**Issue:** `register-page.tsx` writes the literal string `'reg-notice-pending'` directly, while
`registration-notice-listener.tsx` reads/removes it via its own local `FLAG_KEY = 'reg-notice-pending'`
constant. The two are coordinated only by convention — a rename or typo in either file compiles
fine and silently breaks the REG-03 notice flow with no type-level or lint-level signal. Compounding
this, `register-page.test.tsx` never asserts that a successful registration actually sets this key
in `sessionStorage` (`grep` for `reg-notice-pending`/`sessionStorage` in that test file only turns
up the unrelated `sessionStorage.clear()` in `beforeEach`), so a regression here would not be
caught by the test suite either.

**Fix:** Export a shared constant (e.g. from `@/features/auth`) and import it in both places:

```ts
// features/auth/lib/registration-notice.ts
export const REGISTRATION_NOTICE_FLAG_KEY = 'reg-notice-pending';
```

and add a `register-page.test.tsx` assertion that `sessionStorage.getItem(REGISTRATION_NOTICE_FLAG_KEY)`
is `'1'` after a successful submit.

## Info

### IN-01: Enter-key submit while policy/agreement documents are still loading shows a misleading error

**File:** `src/views/auth/ui/register-page.tsx:143-149,264-274`

**Issue:** The submit button is `disabled` while `isPolicyLoading || isAgreementLoading`, but the
`onSubmit` handler is bound to the `<form>` element itself, so pressing Enter in any text input
still fires `handleSubmit(onSubmit)` regardless of the button's disabled state. If the documents
are still loading at that moment, `onSubmit` hits the `!currentPolicy?.version || !currentAgreement?.version`
branch and shows "Не удалось загрузить документы. Обновите страницу." — implying a load failure
when the request is actually still in flight.

**Fix:** Distinguish the loading case from the error case, or guard the handler itself:

```tsx
const onSubmit = async (form: TRegisterForm) => {
    if (isPolicyLoading || isAgreementLoading) return;
    setServerError(null);
    if (!currentPolicy?.version || !currentAgreement?.version) {
        setServerError('Не удалось загрузить документы. Обновите страницу.');
        return;
    }
    // ...
};
```

---

_Reviewed: 2026-07-04T07:53:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
