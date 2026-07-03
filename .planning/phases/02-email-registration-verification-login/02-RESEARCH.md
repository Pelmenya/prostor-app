# Phase 2: Email Registration, Verification & Login - Research

**Researched:** 2026-07-03
**Domain:** Frontend audit-and-harden of an existing email auth flow (register/verify/login) in a Next.js 16 / React 19 FSD app, plus one new UI surface (Telegram entry point on the shared auth screen)
**Confidence:** HIGH (codebase-grounded; every claim in Standard Stack/Architecture/Pitfalls verified by direct source read, not framework-generic assumption)

<user_constraints>

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists yet for this phase (UI-SPEC.md was generated directly from ROADMAP/PROJECT/REQUIREMENTS — status: draft, approval pending). Treat `02-UI-SPEC.md`'s already-**locked** decisions (copy strings, Telegram-button-disabled discretion call, spacing/color/typography) as binding constraints for planning, same authority as CONTEXT.md decisions would carry. `02-UI-SPEC.md`'s "Discretion resolved" callouts (Telegram button disabled in Phase 2; auth-shell = extended login-page.tsx, not a new chooser page) are flagged by UI-SPEC itself as **overridable by planner/user before planning** — carry that flag forward, do not treat as immutable.

### Deferred Ideas (OUT OF SCOPE)

Per REQUIREMENTS.md `## Out of Scope` and PROJECT.md: NextAuth/Auth.js, Яндекс ID OAuth, magic link, Telegram/MAX Mini App view layers, backend auth-endpoint implementation, Telegram notification delivery. Per ROADMAP phase boundary: full Telegram OIDC wiring (TG-01..04) is Phase 3, not this phase — the Telegram button in this phase is visually present but `disabled`.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                     | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REG-01    | Регистрация по email/паролю (имя, фамилия, email, телефон, пароль ≥8, 2 чекбокса) via `POST /auth/web/register` | **Already fully implemented** — `register-page.tsx` has all fields, `registerSchema` (local Zod schema), both consent checkboxes. See Summary/Component Map. Only gap: no direct regression test asserting `webRegister` call payload / success path (Wave 0).                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| REG-02    | После регистрации — сохранить токены, авторизовать, редирект в кабинет                                          | **Already implemented** — `onSubmit` calls `setTokens`+`setUser`+`router.push(getSafeRedirect(...))`. No regression test exists (Wave 0 gap). Default redirect target is `/` (home), not `/profile` — see Pitfall 1 for why this matters for REG-03.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-03    | После регистрации показать «Мы отправили письмо для подтверждения почты»                                        | **Real gap — not rendered anywhere.** `register-page.tsx` redirects immediately, no notice shown pre- or post-redirect. Needs a new one-shot cross-page banner. See Architecture Patterns Pattern 2 and Don't Hand-Roll.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| REG-04    | Неподтверждённая почта НЕ блокирует вход/кабинет                                                                | **Already satisfied by absence of gating code** — verified `proxy.ts`, `profile-page.tsx`, and grepped the whole `src/` tree for `emailVerified`/`is_verified`/`email_verified`: zero hits. `TUser.is_auth` is an unrelated curator/admin field, not email-verification state. Nothing to build; document as "verified absent" (see Runtime State Inventory analogy in Summary).                                                                                                                                                                                                                                                                                                                                        |
| VERIFY-01 | Подтверждение по `/verify-email?token=...` → `POST /auth/verify-email`                                          | **Already implemented** — `verify-email-page.tsx` calls `verifyEmail(token)` on mount via `useEffect` + `hasCalledRef` guard (prevents double-fire in StrictMode).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| VERIFY-02 | Показать «Почта подтверждена»                                                                                   | **Copy drift confirmed** — shipped string is `STATUS_CONFIG.verified.title = 'Email подтверждён'` (`verify-email-page.tsx:15`), locked requirement text is «Почта подтверждена». One-line fix + a test assertion at `verify-email-page.test.tsx:82` will break and needs updating in the same commit.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| VERIFY-03 | Авторизованный пользователь может запросить повторную отправку письма via `POST /auth/resend-verification`      | **API function exists, zero UI entry point.** `resendVerification(accessToken)` is exported from `features/auth` but has no caller anywhere in `src/` (grep confirmed). Needs a new row in `profile-page.tsx`. See Component Inventory / Architecture Patterns Pattern 3.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| LOGIN-01  | Вход по email/паролю via `POST /auth/web/login`                                                                 | **Already implemented** — `login-page.tsx` `onSubmit` calls `webLogin`, stores tokens, redirects.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LOGIN-02  | При 401 — «Неверная почта или пароль», без уточнения о существовании email                                      | **Two-layer gap, not just copy drift.** (1) Copy: shipped fallback string is `'Неверный email или пароль'` (`login-page.tsx:49`), not the locked `'Неверная почта или пароль'`. (2) **Security-relevant logic gap**: `extractErrorMessage(err.data, fallback)` is called unconditionally for _any_ `ApiError`, meaning if the backend's 401 JSON body contains a `message` field (NestJS `class-validator`/exception-filter convention, confirmed via `extractErrorMessage`'s own docstring), that backend message is shown **instead of** the generic fallback — a live account-enumeration risk if the backend's login-401 message differs for "no such user" vs "wrong password". See Pitfall 2 and Security Domain. |

</phase_requirements>

## Summary

**This is the same "audit-and-harden" situation Phase 1 documented, confirmed again by direct source inspection.** `register-page.tsx`, `login-page.tsx`, `verify-email-page.tsx`, `forgot-password-page.tsx`, `reset-password-page.tsx` all exist, are wired to the correct backend endpoints (`/auth/web/register`, `/auth/web/login`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`), and are each covered by a `.test.tsx` file (560 total test lines across 5 files). REG-01, REG-02, VERIFY-01, LOGIN-01 are functionally complete with no code changes needed beyond regression-test coverage. REG-04 requires **no code change at all** — verified by grepping the entire `src/` tree for any `emailVerified`/`is_verified` gating logic and finding none; `TUser` has no such field, `proxy.ts` gates purely on token presence, `profile-page.tsx` gates purely on `user` object presence.

**Three genuine gaps require new code, not just verification:**

1. **REG-03** — the post-registration notice is not rendered anywhere. `register-page.tsx` redirects immediately via `getSafeRedirect(searchParams.get('from'))`, which defaults to `/` (not `/profile`) when there's no `from` param — so the notice cannot live on the register page (already navigated away) or hard-code `/profile` as the landing spot (user may land elsewhere). This needs a cross-page, one-shot banner pattern, following the _exact_ precedent already established by `SessionExpiredListener` (a `null`-rendering listener component mounted in `(web)/layout.tsx`, using `sessionStorage` one-shot flags) — not a new toast library (`react-toastify` is unused/out of scope per UI-SPEC).

2. **VERIFY-03** — `resendVerification(accessToken)` exists in `features/auth/api/auth-api.ts` and is exported from the public API, but has zero callers anywhere in `src/`. UI-SPEC locks the placement: a new row in `profile-page.tsx` matching the exact existing `Изменить почту`/`Сменить пароль` row pattern (`p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4`).

3. **LOGIN-02** — beyond the one-line copy fix, there is a **confirmed logic inconsistency** worth flagging as a security-relevant pitfall, not just cosmetic drift: `forgot-password-page.tsx` already demonstrates the project's correct OWASP-A07-aware pattern (comment: `// Rate limit — показываем, остальные 4xx скрываем (OWASP A07)`) — it only surfaces the backend's message for `status === 400` (rate limit) and hides it for everything else. `login-page.tsx` does **not** follow this same discipline: it calls `extractErrorMessage(err.data, fallback)` for every `ApiError` regardless of status, which means if the backend's 401 response body ever contains a distinguishing `message` (NestJS default behavior for most guards), that message — not the generic fallback — is what the user sees. This is the established project pattern already existing two files away; login-page.tsx should adopt it.

**The one genuinely new UI surface** (not a REG-_/VERIFY-_/LOGIN-\* requirement per se, but explicitly named in this phase's goal and locked in UI-SPEC) is the "shared auth screen shell": extending `login-page.tsx` with a `divider` + disabled `btn-outline btn-primary` "Войти через Telegram" button and a new `TelegramIcon` component, following the exact prop-contract precedent of `src/shared/ui/icons/water-drop.tsx`. UI-SPEC has already resolved this as a **minimal-diff extension of the existing login card**, not a new chooser page — confirmed buildable against current routing (single `/login` route, no structural blockers found).

**Primary recommendation:** Do not rewrite any of the five existing auth pages. Treat this phase as: (1) fix two locked copy strings + update the two test assertions that pin the old strings, (2) harden `login-page.tsx`'s error-handling to match `forgot-password-page.tsx`'s status-gated pattern for LOGIN-02, (3) build the REG-03 one-shot banner reusing the `SessionExpiredListener`-adjacent pattern, (4) add the VERIFY-03 resend row to `profile-page.tsx`, (5) add the disabled-Telegram-button auth-shell extension + new `TelegramIcon`, (6) close the Wave 0 regression-test gaps (register happy path, login 401 exact copy, verify-email exact copy, REG-04 absence-of-gating documentation).

## Architectural Responsibility Map

| Capability                                         | Primary Tier                                                           | Secondary Tier                                                                          | Rationale                                                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration form + validation                     | Browser / Client (`views/auth`, React Hook Form + Zod)                 | API / Backend (`POST /auth/web/register`, uniqueness checks)                            | Client validates shape/format only; backend is authority on email/phone uniqueness, password policy enforcement server-side                                                            |
| Post-registration token storage + redirect         | Browser / Client (`useAuthStore`)                                      | —                                                                                       | Same `setTokens`/`setUser` mechanism Phase 1 already hardened; no new tier needed                                                                                                      |
| Post-registration one-shot notice (REG-03)         | Browser / Client (new listener/banner component in `(web)/layout.tsx`) | —                                                                                       | Must survive a client-side navigation with no server round-trip; `sessionStorage` one-shot flag is the established pattern (`SessionExpiredListener`, `use-form-draft.ts`)             |
| Email verification (link consumption)              | Browser / Client (`verify-email-page.tsx`)                             | API / Backend (`POST /auth/verify-email`, token validation)                             | Token itself is opaque to the client; backend is sole authority on validity/expiry                                                                                                     |
| Resend-verification affordance                     | Browser / Client (new row in `profile-page.tsx`)                       | API / Backend (`POST /auth/resend-verification`, presumably backend-side rate limiting) | Client has no verification-status flag to gate on (`TUser` lacks the field) — must be an always-available idempotent action; backend responsible for anti-abuse throttling             |
| Login form + generic-error handling                | Browser / Client (`views/auth`)                                        | API / Backend (credential check, 401 issuance)                                          | LOGIN-02's "don't reveal existence" requirement is a **frontend responsibility to not re-surface backend detail**, layered on top of whatever the backend already does — see Pitfall 2 |
| Shared auth screen Telegram entry point (disabled) | Browser / Client (extend `login-page.tsx`)                             | —                                                                                       | Purely presentational this phase; no OIDC/nonce logic (Phase 3)                                                                                                                        |

## Standard Stack

### Core

No new dependencies required. Everything REG-_/VERIFY-_/LOGIN-\* needs is already installed and wired:

| Library               | Version (installed)              | Purpose                                                                                                                  | Why Standard (for this codebase)                                         |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| react-hook-form       | 7.71.2 [VERIFIED: package.json]  | All 5 auth forms already use this convention                                                                             | Project-wide form convention, CLAUDE.md-mandated (React Hook Form + Zod) |
| zod                   | 4.3.6 [VERIFIED: package.json]   | Schema validation for all auth forms                                                                                     | Same                                                                     |
| @hookform/resolvers   | 5.2.2 [VERIFIED: package.json]   | `zodResolver` glue                                                                                                       | Same                                                                     |
| zustand               | 5.0.11 [VERIFIED: package.json]  | `useAuthStore` — token/user storage, same store Phase 1 hardened                                                         | No new store needed for this phase                                       |
| @tanstack/react-query | 5.90.21 [VERIFIED: package.json] | `useCurrentPolicy`/`useCurrentAgreement` (register consent versions), `fetchCurrentUser` cache update after email change | Already project-wide                                                     |

### Supporting

| Library         | Version | Purpose | When to Use |
| --------------- | ------- | ------- | ----------- |
| (none required) | —       | —       | —           |

### Alternatives Considered

| Instead of                                                                           | Could Use                                          | Tradeoff                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionStorage` one-shot flag for REG-03 banner (recommended)                       | Toast library (`react-toastify`)                   | `react-toastify` is an unused dependency per UI-SPEC — introducing it for exactly one banner contradicts "audit-and-harden, minimal diff" and the existing `alert-info`/`alert-success` convention already used in `forgot-password-page.tsx`/`reset-password-page.tsx`. Don't introduce it. |
| Extending `login-page.tsx` in place for the Telegram entry point (locked by UI-SPEC) | New `/auth` chooser route with its own page/layout | UI-SPEC already resolved this as out-of-scope-for-diff-size; a new route would also require updating `proxy.ts`'s `AUTH_ONLY` array and duplicate the card shell — no requirement forces this, avoid it                                                                                      |

**Installation:** None required.

## Package Legitimacy Audit

Not applicable — this phase installs no new npm packages. All work is either editing existing files or adding new files using already-installed dependencies (react-hook-form, zod, zustand, heroicons — `@heroicons/react` already a dependency per UI-SPEC's Design System table).

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser tab                                                              │
│                                                                            │
│  /register (register-page.tsx)                                           │
│    RegisterForm.onSubmit                                                 │
│      → webRegister() [POST /auth/web/register]  ── already wired         │
│      → setTokens() + setUser()  [REG-02, already wired]                  │
│      → sessionStorage.setItem('reg-notice-pending', '1')  [NEW — REG-03] │
│      → router.push(getSafeRedirect(from))  → often '/' (no `from`)       │
│                        │                                                  │
│                        ▼                                                  │
│  (web)/layout.tsx  ──  <RegistrationNoticeListener />  [NEW]             │
│    on mount: if sessionStorage flag present → show alert-info banner,    │
│    dismiss (×) clears the flag. Mirrors <SessionExpiredListener /> which │
│    already lives in the exact same layout file for the exact same        │
│    "cross-navigation client-only signal" problem shape.                  │
│                                                                            │
│  /verify-email?token=... (verify-email-page.tsx)                         │
│    useEffect (hasCalledRef guard) → verifyEmail(token)                   │
│      [POST /auth/verify-email] ── already wired                          │
│      success → STATUS_CONFIG.verified.title                              │
│        "Email подтверждён" → FIX → "Почта подтверждена"  [VERIFY-02]    │
│                                                                            │
│  /profile (profile-page.tsx)                                             │
│    existing rows: Личные данные / Изменить почту / Сменить пароль        │
│    [NEW] row: «Подтвердить почту» → resendVerification(accessToken)      │
│      [POST /auth/resend-verification] ── fn exists, wire up UI [VERIFY-03]│
│                                                                            │
│  /login (login-page.tsx)                                                 │
│    LoginForm.onSubmit → webLogin() [POST /auth/web/login]                │
│      catch (ApiError):                                                   │
│        CURRENT: extractErrorMessage(err.data, 'Неверный email...')       │
│          — always trusts backend message if present  [LOGIN-02 gap]     │
│        FIX: gate on err.status, mirror forgot-password-page.tsx's        │
│          "show backend msg only for non-credential-guessing statuses"    │
│          pattern; for 401 always show the LOCKED generic string          │
│    [NEW, disabled] <divider>или</divider>                                │
│                     <button disabled>Войти через Telegram</button>       │
│      — TelegramIcon (new, water-drop.tsx prop-contract clone)            │
│      — no handler; wired in Phase 3 (TG-01)                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new FSD slices needed. This phase's work lands in existing files plus a small number of new files, all within `views/auth`, `features/auth`, `views/profile`, and `shared/ui/icons`:

```
src/views/auth/ui/
├── login-page.tsx              # EDIT: fix LOGIN-02 copy + status-gated error handling;
│                                #   append disabled-Telegram-button auth-shell extension
├── login-page.test.tsx         # EDIT: update assertion for corrected copy; ADD: 401 with
│                                #   backend-provided message still shows generic string
├── register-page.tsx           # EDIT: set sessionStorage one-shot flag before redirect
├── register-page.test.tsx      # ADD: happy-path test (webRegister called, tokens stored,
│                                #   redirect called) — currently only validation is tested
├── verify-email-page.tsx       # EDIT: fix STATUS_CONFIG.verified.title copy (VERIFY-02)
└── verify-email-page.test.tsx  # EDIT: update assertion at line 82 for corrected copy

src/features/auth/ui/
├── session-expired-listener/           # EXISTING — pattern reference only, no changes
└── registration-notice-listener/       # NEW — mirrors session-expired-listener's shape
    ├── registration-notice-listener.tsx
    ├── registration-notice-listener.test.tsx
    └── index.ts

src/features/auth/lib/
└── registration-notice.ts      # NEW — small sessionStorage set/get/clear helper,
                                 #   same shape as use-form-draft.ts's getFormDraft pattern

src/app/(web)/layout.tsx        # EDIT: mount <RegistrationNoticeListener /> alongside
                                 #   the existing <SessionExpiredListener />

src/views/profile/ui/
├── profile-page.tsx            # EDIT: add "Подтвердить почту" row calling
│                                #   resendVerification(accessToken)
└── profile-page.test.tsx       # file existence not yet confirmed — verify at plan time;
                                 #   ADD test for the new row + resend success/error states

src/shared/ui/icons/
├── telegram-icon.tsx           # NEW — same prop contract as water-drop.tsx (size?, className?)
└── index.ts                    # EDIT: export TelegramIcon
```

### Pattern 1: One-shot cross-navigation client signal via `sessionStorage` + layout-mounted listener

**What:** A `null`-rendering client component mounted once in `(web)/layout.tsx` that reads a `sessionStorage` flag on mount, shows UI if present, and clears the flag on dismiss/first-render.

**When to use:** Exactly REG-03's shape — a signal that must survive a `router.push()` navigation (so it can't live in component state) but should not persist across full sessions (so `localStorage` is wrong) and should not require a backend round-trip.

**Existing precedent to clone (`SessionExpiredListener`, verified in this repo):**

```typescript
// Source: src/features/auth/ui/session-expired-listener/session-expired-listener.tsx (existing code)
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isPrivatePath } from '@/shared/config';
import { getSafeRedirect } from '@/shared/lib';

export function SessionExpiredListener() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        function handleSessionExpired(): void {
            if (pathname === '/login') return; // защита от цикла редиректов
            if (!isPrivatePath(pathname)) return;
            router.push(`/login?from=${encodeURIComponent(getSafeRedirect(pathname))}`);
        }
        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [pathname, router]);

    return null;
}
```

**REG-03 adapts this shape but reads a `sessionStorage` flag on mount instead of listening for a `window` event** (no cross-module dispatch is needed here since the flag is set synchronously by the same `register-page.tsx` submit handler before `router.push` runs — a `CustomEvent` would be overkill; `sessionStorage` polling-on-mount is simpler and matches `use-form-draft.ts`'s existing `getFormDraft`/`sessionStorage.getItem` convention). Render an `alert alert-info` (per UI-SPEC's Color contract — NOT `alert-success`, to distinguish "informational" from "action succeeded") with a dismiss `×` that clears the flag and hides the banner.

### Pattern 2: Status-gated error message exposure (OWASP A07 pattern, already established in this codebase)

**What:** Only pass the backend's raw error `message` through to the user for status codes where doing so cannot leak account-existence information; for security-sensitive statuses (401 on login, 400/404 on any "does this account exist" flow), always show a fixed, locked, generic string regardless of what the backend returned.

**Existing precedent to clone (`forgot-password-page.tsx`, verified in this repo):**

```typescript
// Source: src/views/auth/ui/forgot-password-page.tsx (existing code)
const onSubmit = async (form: TForgotPasswordForm) => {
    setServerError(null);
    try {
        await forgotPassword(form.email);
    } catch (err) {
        if (err instanceof ApiError) {
            // Rate limit — показываем, остальные 4xx скрываем (OWASP A07)
            if (err.status === 400) {
                setServerError(extractErrorMessage(err.data, ''));
                return;
            }
        } else {
            setServerError('Ошибка сети');
            return;
        }
    }
    setSent(true); // any other outcome (including "email doesn't exist") looks identical to success
};
```

**LOGIN-02 should adopt the same discipline** — a locked generic string for the 401 case, not `extractErrorMessage(err.data, fallback)` unconditionally:

```typescript
// Recommended pattern for login-page.tsx onSubmit catch block
} catch (err) {
    if (err instanceof ApiError) {
        // Не раскрываем backend-сообщение на 401 — OWASP A07,
        // единое сообщение независимо от причины (несуществующий email vs неверный пароль)
        setServerError('Неверная почта или пароль');
    } else {
        setServerError('Ошибка сети');
    }
}
```

### Anti-Patterns to Avoid

- **Adding a `react-toastify`/toast-library dependency for REG-03.** The project has zero toast usage today; `alert-info`/`alert-success` inline banners are the established pattern across all 5 existing auth pages. UI-SPEC explicitly rules this out.
- **Gating VERIFY-03's resend row on an `emailVerified` flag that doesn't exist.** `TUser` has no such field (grep-confirmed). Do not invent a client-side heuristic (e.g., "hide if user has ever clicked a verify link") — UI-SPEC explicitly says make it an always-available idempotent action. If a verified/unverified distinction is wanted later, that's a backend-coordination task, not something to fake client-side.
- **Trusting `extractErrorMessage`'s backend passthrough for any credential-guessing-adjacent status code.** This is the core LOGIN-02 pitfall — see Pattern 2 above and Pitfall 2 below.
- **Building a new `/auth` chooser route for the Telegram entry point.** UI-SPEC has already resolved this in favor of extending `login-page.tsx` in place — a new route is a larger diff with no requirement forcing it and would require `proxy.ts` `AUTH_ONLY` array changes.

## Don't Hand-Roll

| Problem                                                                | Don't Build                                                                                                | Use Instead                                                                                                                      | Why                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-navigation one-shot UI signal (REG-03)                           | A new global event bus, a new toast system, or component-state-based approach that breaks on `router.push` | `sessionStorage` flag + layout-mounted listener component, cloning `SessionExpiredListener`'s exact shape                        | This exact problem shape (client-only signal that must survive navigation) is already solved twice in this codebase (`SessionExpiredListener` for the event case, `use-form-draft.ts` for the persistence-read case) — compose from those, don't invent a third pattern |
| Redirect-target sanitization (already used by both register and login) | A new redirect validator for any new redirect logic touched in this phase                                  | `getSafeRedirect()` [VERIFIED: src/shared/lib/get-safe-redirect.ts]                                                              | Already validates path starts with `/`, rejects `//`, `/\`, `javascript:` — reuse, don't duplicate                                                                                                                                                                      |
| Generic vs. backend-passthrough error message decision                 | A new "is this error safe to show" heuristic invented from scratch                                         | Clone `forgot-password-page.tsx`'s status-gated pattern (Pattern 2 above)                                                        | Already correctly solves the exact same OWASP A07 tradeoff this codebase has already reasoned through once                                                                                                                                                              |
| New icon component                                                     | A generic SVG-wrapper abstraction or pulling in an icon library just for Telegram                          | Clone `water-drop.tsx`'s prop contract (`size?: number`, `className?: string`, single outline path) — UI-SPEC already locks this | Consistency with the existing custom-icon convention (`src/shared/ui/icons/`), avoids introducing `react-icons`/`simple-icons` for one glyph                                                                                                                            |

**Key insight:** Same as Phase 1 — the risk here is not under-building but duplicate-building. Every genuine gap in this phase (REG-03 banner, VERIFY-03 entry point, LOGIN-02 error handling) has a near-identical existing pattern elsewhere in the codebase to clone from. The planner's job is composition, not invention.

## Runtime State Inventory

Not applicable — this is not a rename/refactor/migration phase. No trigger condition met.

## Common Pitfalls

### Pitfall 1: REG-03's banner cannot assume the user lands on `/profile`

**What goes wrong:** It's tempting to hard-code the REG-03 notice inside `profile-page.tsx` (since that's the "personal cabinet" the requirement mentions). But `register-page.tsx`'s redirect target is `getSafeRedirect(searchParams.get('from'))`, and `getSafeRedirect(null)` returns `'/'` — the home/catalog page, not `/profile`. A user registering with no `from` query param (the common case — arriving at `/register` directly, not via a redirect-from-private-page flow) lands on `/`, and a notice placed only inside `profile-page.tsx` would never render for them.

**Why it happens:** Confusing "personal cabinet" (the requirement's business language) with "`/profile` route" (one specific page) — the actual authenticated landing experience is "whatever page you get redirected/land on," which varies.

**How to avoid:** Mount the notice listener at the `(web)/layout.tsx` level (wraps every page in the web layout, same as `SessionExpiredListener`), not inside any single page component. This is already the pattern — don't special-case it.

**Warning signs:** If a manual test registers with no prior page context and never sees the banner, this is the first place to check.

### Pitfall 2: `extractErrorMessage`'s unconditional backend-passthrough on `login-page.tsx` is a live LOGIN-02 gap, not just copy drift

**What goes wrong:** `login-page.tsx:49` currently does `extractErrorMessage(err.data, 'Неверный email или пароль')` for _every_ `ApiError`, with no status check. `extractErrorMessage`'s own docstring says it reads NestJS's `class-validator`-style `{ message: string | string[] }` body — if `POST /auth/web/login`'s 401 response ever contains a `message` field (which is NestJS's default behavior for most exception filters unless explicitly suppressed), that backend string is shown verbatim, bypassing the locked generic copy entirely. Depending on backend implementation, that message could differ between "no account with this email" and "wrong password" — the exact enumeration vector LOGIN-02 exists to close.

**Why it happens:** `login-page.tsx` was written before `forgot-password-page.tsx`'s status-gated OWASP A07 pattern was established (or the pattern wasn't back-ported). This is exactly the kind of drift that happens when the same class of problem is solved twice, in two different files, at two different times.

**How to avoid:** For the login 401 case specifically, do not call `extractErrorMessage` at all — always show the fixed locked string `'Неверная почта или пароль'`. Reserve `extractErrorMessage` for statuses where backend detail is genuinely safe to show (e.g., a network/5xx branch, or a future rate-limit 400 case mirroring `forgot-password-page.tsx`).

**Warning signs:** A regression test that mocks `webLogin` to reject with an `ApiError(401, ..., { message: 'User not found' })` and asserts the rendered text is still the generic string (not "User not found") — this test does not exist today and should be added in Wave 0.

**Note on backend contract:** This session could not inspect `crm-aqua-kinetics-back`'s actual controller code (backend repo not present on this machine/path). This pitfall's exact severity (whether the backend currently _does_ return a distinguishing message) is `[ASSUMED — not verified against backend source this session]`; the fix is recommended regardless because it is strictly safer and costs nothing, matching the precedent already set by `forgot-password-page.tsx` for the analogous case. Flag to the user/backend-agent if precise confirmation of backend 401-body contents is wanted before implementing.

### Pitfall 3: `verify-email-page.test.tsx:82` pins the wrong copy — fixing VERIFY-02 without updating the test will look like a regression

**What goes wrong:** `expect(screen.getByText('Email подтверждён')).toBeInTheDocument()` at line 82 currently asserts the _incorrect_ (per REQUIREMENTS.md) copy. If the planner fixes `STATUS_CONFIG.verified.title` without updating this assertion, the test suite will show a failure that looks like a regression rather than an intentional, required fix.

**Why it happens:** The test was written to match whatever shipped, not against the locked requirement text — normal drift for a page that predates this GSD milestone's requirements doc.

**How to avoid:** Fix the copy and the test assertion in the same task/commit; don't split them across waves.

**Warning signs:** CI red immediately after a copy-only change with no corresponding test update.

### Pitfall 4: `resendVerification` has no rate-limit/cooldown UI state — a plain click could double-fire before the request resolves

**What goes wrong:** `features/auth/api/auth-api.ts`'s `resendVerification(accessToken)` has no client-side debounce/disable-while-pending guard by default (it's just a `fetch` wrapper). If the new profile row's button isn't disabled during the in-flight request, a fast double-click sends two `POST /auth/resend-verification` calls.

**Why it happens:** New UI surface, no existing precedent in this exact file to copy from (the closest analogues — `change-password-page.tsx`, `change-email-page.tsx` — already use `isSubmitting` from React Hook Form for their forms, but this is a plain button, not a form).

**How to avoid:** Use local `useState` (`isSending`/`isSubmitting`) around the `resendVerification` call, disable the button while pending, exactly mirroring the `disabled={isSubmitting}` pattern already used on every submit button in the 5 existing auth pages.

**Warning signs:** Manual test — rapid double-click the new "Отправить письмо повторно" button, check Network tab for duplicate calls.

## Code Examples

### REG-03: `sessionStorage` set (in `register-page.tsx`, before redirect)

```typescript
// Recommended addition to RegisterForm.onSubmit, src/views/auth/ui/register-page.tsx,
// immediately before router.push(...)
clearDraft();
setTokens(data.accessToken, data.refreshToken);
setUser(data.user);
resetSessionExpiredNotified();
sessionStorage.setItem('reg-notice-pending', '1'); // NEW — read by RegistrationNoticeListener
router.push(getSafeRedirect(searchParams.get('from')));
```

### REG-03: listener/banner component (new file, mirrors `SessionExpiredListener`'s file shape)

```typescript
// Source: pattern derived from src/features/auth/ui/session-expired-listener/session-expired-listener.tsx
'use client';
import { useEffect, useState } from 'react';

const FLAG_KEY = 'reg-notice-pending';

export function RegistrationNoticeListener() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (sessionStorage.getItem(FLAG_KEY) === '1') {
            setVisible(true);
        }
    }, []);

    function dismiss() {
        sessionStorage.removeItem(FLAG_KEY);
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="alert alert-info text-sm flex items-center justify-between">
            <span>Мы отправили письмо для подтверждения почты</span>
            <button onClick={dismiss} aria-label="Закрыть" className="btn btn-ghost btn-xs">
                ×
            </button>
        </div>
    );
}
```

### VERIFY-03: resend row in `profile-page.tsx`

```typescript
// Recommended addition to src/views/profile/ui/profile-page.tsx, matching the
// exact existing row pattern (p-4 bg-base-100 rounded-2xl border ... flex items-center gap-4)
const [isSending, setIsSending] = useState(false);
const [resendResult, setResendResult] = useState<'idle' | 'success' | 'error'>('idle');

async function handleResend() {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken || isSending) return;
    setIsSending(true);
    try {
        await resendVerification(accessToken);
        setResendResult('success');
    } catch {
        setResendResult('error');
    } finally {
        setIsSending(false);
    }
}
```

## State of the Art

| Old Approach                                                                                   | Current Approach                                                                                                                                                 | When Changed                      | Impact                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| N/A — no prior GSD-tracked auth research for register/verify/login existed before this session | REG-01/02/VERIFY-01/LOGIN-01 already implemented pre-milestone (PR #6, #9, #10, #20 per PROJECT.md); this phase verifies + closes 3 gaps + adds 1 new UI surface | Already implemented pre-milestone | Planner should treat REG-01/02, VERIFY-01, LOGIN-01 as "verify + test," and REG-03/VERIFY-03/LOGIN-02(logic)/Telegram-shell as "build" |

**Deprecated/outdated:** None found specific to this phase — `.planning/codebase/CONCERNS.md`'s auth-related staleness was already documented and flagged in Phase 1's research; this phase's findings are consistent with that correction (auth is much further along than `CONCERNS.md` implies).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                           | Section                            | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | The backend's `POST /auth/web/login` 401 response may contain a distinguishing `message` field that differs between "no such account" and "wrong password" — not verified against actual backend source this session (backend repo not present on this machine) | Pitfall 2, Security Domain         | If the backend actually already returns a fully generic message for all login failures, the LOGIN-02 fix is still strictly safer/correct but slightly less urgent than framed. If the backend genuinely does leak distinguishing detail today, this is an active, currently-shipped enumeration vulnerability the fix directly closes — worth flagging to the user/backend-agent as a finding, not just a copy-fix task.     |
| A2  | `sessionStorage` (not a `CustomEvent`, not `localStorage`) is the correct mechanism for REG-03's one-shot cross-navigation signal                                                                                                                               | Architecture Patterns Pattern 1    | If wrong (e.g., user wants the notice to persist across a full browser restart, which `sessionStorage` doesn't survive), a different storage mechanism would be needed. Low risk — the requirement text ("после регистрации") implies same-session, one-time, matching `sessionStorage`'s exact semantics.                                                                                                                   |
| A3  | REG-04 requires no code changes because no gating logic exists anywhere in the codebase (verified via grep of `emailVerified`/`is_verified`/`email_verified` across all of `src/`)                                                                              | Phase Requirements REG-04, Summary | If a gating check exists server-side (backend blocks unverified-email users from certain endpoints) that this frontend audit cannot see, REG-04 might actually require frontend error-handling for a backend-side block that hasn't manifested yet. Backend repo unavailable to cross-check this session — flag as a coordination point if any backend 403-on-unverified-email behavior is discovered during implementation. |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Should the Telegram button's disabled state in Phase 2 be reconsidered?**
    - What we know: UI-SPEC explicitly resolved this in favor of `disabled` (no handler, tooltip only), citing "shipping an enabled button with no working handler is worse UX than an honest disabled state," and explicitly flagged it as an overridable discretion call for the planner/user.
    - What's unclear: Whether the user has a strong preference either way — this affects the Phase 2/Phase 3 scope boundary.
    - Recommendation: Default to UI-SPEC's resolution (disabled); the planner should carry the flag forward rather than re-litigate, but should note it in the plan's assumptions/risks section for one final human check before execution.

2. **Exact backend 401 response contract for `POST /auth/web/login`**
    - What we know: `extractErrorMessage`'s docstring documents NestJS's general `{ message: string | string[] }` shape; `forgot-password-page.tsx` already treats non-400 statuses as unsafe to surface.
    - What's unclear: Whether `/auth/web/login`'s 401 specifically returns a generic message today (making this fix defense-in-depth) or a distinguishing one (making this fix an active vulnerability closure). Backend repo not available on this machine this session.
    - Recommendation: Implement the fix regardless (it's strictly correct either way per Pattern 2), but flag to the user that backend-side confirmation would be useful context, not a blocker.

## Environment Availability

Not applicable — no new external tools, services, or runtimes are needed for this phase. Backend endpoints (`/auth/web/register`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/web/login`) are already deployed per PROJECT.md's Validated section and Phase 1's research (not re-probed this session; treated as available per the same project decision log Phase 1 relied on).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 3.2.4 [VERIFIED: package.json, confirmed identical to Phase 1's research]                                                                                                                           |
| Config file        | `vitest.config.ts`                                                                                                                                                                                         |
| Quick run command  | `npm run test -- src/views/auth/ui/register-page.test.tsx src/views/auth/ui/login-page.test.tsx src/views/auth/ui/verify-email-page.test.tsx src/views/profile/ui/profile-page.test.tsx src/features/auth` |
| Full suite command | `npm run test`                                                                                                                                                                                             |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                 | Test Type     | Automated Command                                                                                                                                                                   | File Exists?                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| REG-01    | All fields render, validation errors show, consent checkboxes required                                   | unit          | `npm run test -- src/views/auth/ui/register-page.test.tsx`                                                                                                                          | ✅ (already covers this)                                                                                                                        |
| REG-02    | `webRegister` called with correct payload → tokens stored → redirect fires                               | unit          | `npm run test -- src/views/auth/ui/register-page.test.tsx`                                                                                                                          | ❌ Wave 0 — happy-path/redirect assertion missing                                                                                               |
| REG-03    | Notice appears once after redirect, dismiss clears flag, doesn't reappear on next navigation             | unit          | `npm run test -- src/features/auth` (new `registration-notice-listener.test.tsx`)                                                                                                   | ❌ Wave 0 — component + test don't exist                                                                                                        |
| REG-04    | No component/route blocks access based on email-verification state                                       | unit + manual | Grep-based verification already performed this session; add a regression test asserting `profile-page.tsx` renders for a `user` object with no `emailVerified`-shaped field present | ❌ Wave 0 — no explicit regression test locks this absence-of-behavior in                                                                       |
| VERIFY-01 | `verifyEmail(token)` called on mount with URL token                                                      | unit          | `npm run test -- src/views/auth/ui/verify-email-page.test.tsx`                                                                                                                      | ✅ (already covers this)                                                                                                                        |
| VERIFY-02 | Success state shows «Почта подтверждена» (corrected copy)                                                | unit          | `npm run test -- src/views/auth/ui/verify-email-page.test.tsx`                                                                                                                      | ❌ Wave 0 — existing assertion pins wrong copy, must be updated as part of the fix                                                              |
| VERIFY-03 | Resend button calls `resendVerification(accessToken)`, shows success/error state, disabled while pending | unit          | `npm run test -- src/views/profile/ui/profile-page.test.tsx` (verify file exists at plan time)                                                                                      | ❌ Wave 0 — feature + test don't exist                                                                                                          |
| LOGIN-01  | `webLogin` called, tokens stored, redirect fires                                                         | unit          | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                                                                                                             | ✅ (already covers this)                                                                                                                        |
| LOGIN-02  | 401 with backend-provided distinguishing message still renders the generic locked string                 | unit          | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                                                                                                             | ❌ Wave 0 — this exact case (backend message present but must be suppressed) is not tested; only the fallback-string case is implicitly covered |

### Sampling Rate

- **Per task commit:** `npm run test -- <changed test files>`
- **Per wave merge:** `npm run test` (full suite — Husky pre-commit already runs `vitest run --changed`, but a full run before phase gate is still recommended per Phase 1's established convention)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/views/auth/ui/register-page.test.tsx` — add happy-path test: `webRegister` called with mapped payload, `setTokens`/`setUser` called, `router.push` called with the redirect target (REG-02)
- [ ] `src/views/auth/ui/login-page.test.tsx` — add: 401 with `ApiError.data.message` set to an arbitrary backend string still renders the locked generic `'Неверная почта или пароль'` copy (LOGIN-02); update any assertion currently pinning `'Неверный email или пароль'`
- [ ] `src/views/auth/ui/verify-email-page.test.tsx:82` — update assertion from `'Email подтверждён'` to `'Почта подтверждена'` in the same change that fixes `STATUS_CONFIG.verified.title` (VERIFY-02)
- [ ] `src/features/auth/ui/registration-notice-listener/registration-notice-listener.test.tsx` — new file, does not exist; must cover mount-with-flag-set → banner visible, dismiss → flag cleared + banner hidden, mount-without-flag → nothing rendered (REG-03)
- [ ] `src/views/profile/ui/profile-page.test.tsx` — verify existence at plan time (not found by this session's file search — likely doesn't exist yet); if missing, create it; must cover the new resend row: click → `resendVerification` called, pending-disables-button, success/error states (VERIFY-03)
- [ ] `src/shared/ui/icons/telegram-icon.test.tsx` or equivalent — light smoke test only if the project's icon-component convention includes tests (verify by checking whether `water-drop.tsx` has a sibling test file at plan time)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies       | Standard Control                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | Yes           | Credential handling itself is backend responsibility (out of scope), but **generic-error-message discipline on the frontend is directly this phase's responsibility** for LOGIN-02 — see Pitfall 2 and Pattern 2. Password minimum length (8 chars) already enforced client-side in `registerSchema`/`newPasswordSchema` [VERIFIED: auth-schemas.ts, register-page.tsx], mirroring (not replacing) backend enforcement. |
| V3 Session Management | No (new work) | Already fully covered by Phase 1 (SESSION-01..05) — this phase reuses `setTokens`/`setUser`/`useAuthStore` unchanged, no new session-management logic introduced.                                                                                                                                                                                                                                                       |
| V4 Access Control     | Partial       | REG-04's requirement ("unverified email does not block access") is itself a deliberate _absence_ of an access-control gate — verified no such gate exists client-side; this is the correct, requirement-compliant state, not a gap to fix.                                                                                                                                                                              |
| V5 Input Validation   | Yes           | All 5 auth forms already use Zod schemas (`registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`) for client-side validation, backed by backend validation (not this phase's concern to verify). New work (resend button) has no user-text-input surface, so no new schema needed there.                                                                                                        |
| V6 Cryptography       | No            | No token/crypto logic touched this phase — untouched from Phase 1's already-hardened `api-client.ts`.                                                                                                                                                                                                                                                                                                                   |

### Known Threat Patterns for this stack

| Pattern                                                                              | STRIDE                                                                  | Standard Mitigation                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account enumeration via differing login-failure messages (LOGIN-02's core concern)   | Information Disclosure                                                  | Locked generic error string shown for all 401s regardless of backend response content — see Pattern 2/Pitfall 2. OWASP Authentication Cheat Sheet: "an application must respond with a generic error message regardless of whether the user ID or password was incorrect, the account does not exist, or the account is locked or disabled" [CITED: OWASP Authentication Cheat Sheet, cheatsheetseries.owasp.org] |
| Account enumeration via HTTP status-code differences (even with identical body text) | Information Disclosure                                                  | Out of this frontend phase's control — OWASP notes status codes themselves can leak existence even when the displayed message is generic. Flag to backend-agent if precise verification is wanted; frontend cannot fix a status-code-level leak, only a message-level one.                                                                                                                                        |
| Verification-link token replay/guessing                                              | Spoofing                                                                | Token validation itself is backend responsibility (`POST /auth/verify-email`); frontend's only responsibility is not to expose additional information on failure beyond the existing "Ссылка недействительна или истекла" generic message (already correct, unchanged this phase).                                                                                                                                |
| Resend-verification abuse (spam-triggering repeated emails)                          | Denial of Service (against the mail-sending budget, not the app itself) | Client-side: disable button while request is pending (Pitfall 4) — a UX safeguard, not a security control. Actual rate-limiting must be backend-side (out of this phase's scope, same as `forgot-password-page.tsx`'s existing comment acknowledges for its own rate-limit-adjacent 400 case).                                                                                                                    |

## Sources

### Primary (HIGH confidence)

- `src/views/auth/ui/register-page.tsx`, `register-page.test.tsx` — direct source read, this session
- `src/views/auth/ui/login-page.tsx`, `login-page.test.tsx` — direct source read, this session
- `src/views/auth/ui/verify-email-page.tsx`, `verify-email-page.test.tsx` — direct source read, this session
- `src/views/auth/ui/forgot-password-page.tsx`, `forgot-password-page.test.tsx` — direct source read, this session
- `src/views/auth/ui/reset-password-page.tsx`, `reset-password-page.test.tsx` — direct source read (test structure only), this session
- `src/features/auth/api/auth-api.ts`, `src/features/auth/index.ts`, `src/features/auth/lib/auth-schemas.ts` — direct source read, this session
- `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx` — direct source read, this session (reused as architectural pattern precedent)
- `src/shared/lib/auth/auth-store.ts`, `src/shared/lib/get-safe-redirect.ts`, `src/shared/lib/extract-error-message.ts`, `src/shared/lib/hooks/use-form-draft.ts` — direct source read, this session
- `src/shared/model/t-user.ts` — direct source read, this session (confirms no `emailVerified` field)
- `src/views/profile/ui/profile-page.tsx` — direct source read, this session
- `src/proxy.ts`, `src/shared/config/private-paths.ts` — direct source read, this session (confirms REG-04 has no gating anywhere)
- `src/app/(web)/layout.tsx` — direct source read, this session (confirms `SessionExpiredListener` mount point precedent)
- `src/shared/ui/icons/water-drop.tsx`, `src/shared/ui/icons/index.ts` — direct source read, this session (icon prop-contract precedent)
- Whole-tree `grep` for `emailVerified|is_verified|isEmailVerified|email_verified` and `resendVerification` — executed this session, zero and two hits respectively, confirming both REG-04's absence-of-gating and VERIFY-03's no-UI-entry-point findings
- `package.json` — direct read, this session (react-hook-form 7.71.2, zod 4.3.6, @hookform/resolvers 5.2.2, zustand 5.0.11, @tanstack/react-query 5.90.21, next 16.1.6, react 19.2.3)
- `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/config.json`, `.planning/phases/02-email-registration-verification-login/02-UI-SPEC.md` — this session
- `.planning/phases/01-jwt-session-lifecycle/01-RESEARCH.md` — this session (structural/methodological precedent for this document)

### Secondary (MEDIUM confidence)

- [Authentication - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — generic-error-message guidance cited in Security Domain, confirmed via WebSearch aggregation this session (not read directly from the source page's full text)

### Tertiary (LOW confidence)

- None — this phase had no need for tertiary-tier sources; nearly all findings are direct codebase reads.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies needed, existing stack directly verified via `package.json` and 10+ source files read in full
- Architecture: HIGH — diagram and file map drawn directly from reading the actual current implementation and its closest existing precedents (`SessionExpiredListener`, `forgot-password-page.tsx`), not from generic auth-flow tutorials
- Pitfalls: HIGH for Pitfalls 1, 3, 4 (traced through actual current code/tests); MEDIUM for Pitfall 2's severity claim specifically (the _fix_ is HIGH-confidence-correct regardless, but whether the backend _currently_ leaks distinguishing 401 messages is unverified this session — backend repo unavailable)

**Research date:** 2026-07-03
**Valid until:** 2026-08-02 (30 days — stable domain; re-verify against the working tree if auth-related commits land before planning executes, same caveat Phase 1's research carried)
