# Phase 2: Email Registration, Verification & Login - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 11 (3 new, 8 edit-existing)
**Analogs found:** 11 / 11

## File Classification

| New/Modified File                                                                         | Role                           | Data Flow                                           | Closest Analog                                                                                                                                                    | Match Quality                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx`      | component (listener)           | event-driven (sessionStorage-signalled)             | `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx`                                                                                      | exact (same layout-mounted null-render listener shape, different trigger source)  |
| `src/features/auth/ui/registration-notice-listener/index.ts`                              | config (public API barrel)     | —                                                   | `src/features/auth/ui/session-expired-listener/index.ts`                                                                                                          | exact                                                                             |
| `src/features/auth/ui/registration-notice-listener/registration-notice-listener.test.tsx` | test                           | event-driven                                        | `src/features/auth/ui/session-expired-listener/session-expired-listener.test.tsx`                                                                                 | exact                                                                             |
| `src/app/(web)/layout.tsx`                                                                | provider/composition (edit)    | —                                                   | itself (already mounts `SessionExpiredListener`)                                                                                                                  | exact — one-line addition                                                         |
| `src/views/auth/ui/register-page.tsx`                                                     | component (edit — form page)   | request-response (CRUD-adjacent: create session)    | itself                                                                                                                                                            | exact — one-line addition before `router.push`                                    |
| `src/views/auth/ui/login-page.tsx`                                                        | component (edit — form page)   | request-response                                    | `src/views/auth/ui/forgot-password-page.tsx` (for the error-handling edit)                                                                                        | exact — status-gated error pattern already lives there                            |
| `src/views/auth/ui/login-page.tsx` (Telegram button block)                                | component (edit — UI addition) | request-response                                    | UI-SPEC-specified inline markup, no live analog needed (static disabled button)                                                                                   | n/a — spec is prescriptive                                                        |
| `src/views/auth/ui/verify-email-page.tsx`                                                 | component (edit — copy fix)    | request-response                                    | itself                                                                                                                                                            | exact — string literal change only                                                |
| `src/shared/ui/icons/telegram-icon.tsx`                                                   | component (icon)               | —                                                   | `src/shared/ui/icons/water-drop.tsx` (`variant: 'outline'` branch)                                                                                                | exact (prop-contract + SVG-path convention)                                       |
| `src/shared/ui/icons/index.ts`                                                            | config (barrel, edit)          | —                                                   | itself                                                                                                                                                            | exact                                                                             |
| `src/views/profile/ui/profile-page.tsx`                                                   | component (edit — new row)     | request-response (fire-and-forget action, not CRUD) | itself (existing `Изменить почту`/`Сменить пароль` `<Link>` rows) — action variant needs a `<button>`-based row, closest local precedent is the row markup itself | exact for markup, adapted for interactivity (button vs Link, local pending state) |

## Pattern Assignments

### `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` (component/listener, event-driven)

**Analog:** `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx`

**Full analog file** (33 lines — read in full, no re-read needed):

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isPrivatePath } from '@/shared/config';
import { getSafeRedirect } from '@/shared/lib';

/**
 * Слушает window-событие auth:session-expired (диспатчится из api-client.ts
 * при терминальном провале refresh, SESSION-04) и форсирует редирект на
 * /login с приватных страниц. Подключается в (web)/layout.tsx рядом с
 * CartSyncProvider. Рендерит null — только логика.
 */
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

**What to copy:** the file shape — `'use client'` directive, single exported component, `null`-render-by-default, effect-driven side logic, JSDoc block describing where it's dispatched from and where it's mounted (mirror this convention: state where `registration-notice-listener.tsx` reads its flag from — set by `register-page.tsx` — and that it's mounted in `(web)/layout.tsx`).

**What differs (do not copy literally):**

- No `window.addEventListener` — this listener reads `sessionStorage` **on mount** (`useEffect(() => {...}, [])`, empty deps), not on a window event, because the flag is set synchronously by `register-page.tsx` before `router.push()` runs (see RESEARCH.md Pattern 1).
- Unlike `SessionExpiredListener`, this component **does** render UI (the dismissible `alert-info` banner) — it is not `null`-only. Needs local `useState<boolean>` for visibility, toggled by a `dismiss()` handler that also clears the `sessionStorage` key.
- No `router`/`pathname` dependency needed — no redirect logic, just a read-and-clear on a fixed key (`'reg-notice-pending'`).

**Concrete adaptation** (from RESEARCH.md Code Examples, cross-checked against the analog's structure):

```typescript
'use client';

import { useEffect, useState } from 'react';

const FLAG_KEY = 'reg-notice-pending';

/**
 * Читает sessionStorage-флаг, выставленный register-page.tsx перед
 * router.push (REG-03). Показывает alert-info один раз на первой странице
 * после регистрации — независимо от того, куда пришёл редирект
 * (getSafeRedirect по умолчанию ведёт на '/', не на /profile).
 * Подключается в (web)/layout.tsx рядом с SessionExpiredListener.
 */
export function RegistrationNoticeListener() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
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

**Barrel export pattern** — check `src/features/auth/ui/session-expired-listener/index.ts` shape (single named re-export) and mirror it exactly for the new slice's `index.ts`. `src/features/auth/index.ts` line 9 already shows the top-level barrel convention (`resendVerification,` listed alongside other named exports) — add `RegistrationNoticeListener` there too, same style.

---

### `src/app/(web)/layout.tsx` (edit — mount point)

**Analog:** itself, lines 1-13 (already mounts `SessionExpiredListener`)

**Current relevant excerpt:**

```typescript
import { CartSyncProvider } from '@/features/cart';
import { SearchModalMount } from '@/features/product-search';
import { SessionExpiredListener } from '@/features/auth';

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterSW />
            <CartSyncProvider />
            <SessionExpiredListener />
```

**Change:** add `RegistrationNoticeListener` to the `@/features/auth` import and mount it directly after `<SessionExpiredListener />` (same import source since both live in `features/auth`, no new import line needed beyond extending the destructure).

---

### `src/views/auth/ui/register-page.tsx` (edit — REG-03 flag set)

**Analog:** itself, `onSubmit` body (lines 143-173), specifically the `try` block (lines 151-165)

**Current excerpt (lines 160-165):**

```typescript
clearDraft();
setTokens(data.accessToken, data.refreshToken);
setUser(data.user);
resetSessionExpiredNotified();
router.push(getSafeRedirect(searchParams.get('from')));
```

**Change:** insert one line before `router.push`:

```typescript
clearDraft();
setTokens(data.accessToken, data.refreshToken);
setUser(data.user);
resetSessionExpiredNotified();
sessionStorage.setItem('reg-notice-pending', '1'); // NEW — read by RegistrationNoticeListener
router.push(getSafeRedirect(searchParams.get('from')));
```

Match the exact same call-order convention already established (token storage → session reset → new side-effect → navigate) — this file's own existing sequence is the pattern to extend, not `login-page.tsx`'s (which has no such side-effect line to insert next to).

---

### `src/views/auth/ui/login-page.tsx` (edit — LOGIN-02 status-gated error + Telegram button)

**Analog for error handling:** `src/views/auth/ui/forgot-password-page.tsx`, `onSubmit` catch block (lines 25-42)

**Analog excerpt (lines 29-39):**

```typescript
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
```

**Current login-page.tsx code to replace** (lines 47-53):

```typescript
} catch (err) {
    if (err instanceof ApiError) {
        setServerError(extractErrorMessage(err.data, 'Неверный email или пароль'));
    } else {
        setServerError('Ошибка сети');
    }
}
```

**Target pattern** (per RESEARCH.md recommendation, mirroring `forgot-password-page.tsx`'s status-gating discipline but inverted — login's sensitive status is 401, not 400):

```typescript
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

Note: `extractErrorMessage` import becomes unused in this file if this is the only call site — verify at implementation time and remove the import if so (avoid unused-import lint failure).

**Analog for Telegram button placement:** UI-SPEC Component Inventory #1 (prescriptive markup, not a live analog) — insert after the `Войти` submit `<button>` (line 92, inside `</form>`) and before the footer `<div className="flex flex-col items-center gap-2 mt-4 text-sm">` (line 95):

```tsx
<div className="divider text-sm text-base-content/50">или</div>
<button
    className="btn btn-outline btn-primary w-full gap-2"
    disabled
    title="Появится после запуска Telegram-входа"
>
    <TelegramIcon className="size-5" /> Войти через Telegram
</button>
```

Import `TelegramIcon` from `@/shared/ui` (follow existing `PageContainer, FormField` import-from-shared-ui convention already on line 17 of `login-page.tsx`).

---

### `src/views/auth/ui/verify-email-page.tsx` (edit — VERIFY-02 copy fix)

Not read in full this pass (RESEARCH.md already pinpoints exact target): `STATUS_CONFIG.verified.title` — change string from `'Email подтверждён'` to `'Почта подтверждена'`. Corresponding test assertion at `verify-email-page.test.tsx:82` must be updated in the same change (currently pins `getByText('Email подтверждён')`).

---

### `src/shared/ui/icons/telegram-icon.tsx` (new component, icon)

**Analog:** `src/shared/ui/icons/water-drop.tsx`, `variant === 'outline'` branch (lines 55-70)

**Analog excerpt to clone the shape of:**

```typescript
type TWaterDropProps = {
    size?: number;
    animated?: boolean;
    variant?: 'filled' | 'outline';
    className?: string;
};

export function WaterDrop({ size, animated = false, variant = 'filled', className = '' }: TWaterDropProps) {
    const sizeProps: Record<string, string | number> = size
        ? { width: size, height: size }
        : { width: '100%', height: '100%' };

    if (variant === 'outline') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...sizeProps}
            >
                <path d="M24 4 C30 12 38 18 38 28 a14 14 0 1 1-28 0 c0-10 8-16 14-24z" />
            </svg>
        );
    }
    // ...filled branch not relevant to TelegramIcon
}
```

**What to copy:** the `size?: number` / `className?: string` prop contract, the `sizeProps` width/height-fallback-to-100%-via-CSS pattern, `xmlns`, `stroke="currentColor"` (per UI-SPEC's explicit color rule — never Telegram brand blue `#26A5E4`), single-path outline SVG.

**What to omit** (per UI-SPEC — this is a single-variant icon, no `filled`/`animated` needed): no `variant` prop, no `animated` prop, no gradient `<defs>`, no sparkle `<g>` group. `viewBox="0 0 24 24"` per UI-SPEC (not `0 0 48 48`) since this matches heroicons' own viewBox convention (project mixes custom SVGs with `@heroicons/react/24/outline`, both at `24x24`).

**Target shape:**

```typescript
type TTelegramIconProps = {
    size?: number;
    className?: string;
};

export function TelegramIcon({ size, className = '' }: TTelegramIconProps) {
    const sizeProps: Record<string, string | number> = size
        ? { width: size, height: size }
        : { width: '100%', height: '100%' };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...sizeProps}
        >
            {/* paper-plane glyph path — see UI-SPEC Component Inventory #1 */}
        </svg>
    );
}
```

**Barrel export** — `src/shared/ui/icons/index.ts` (current full content, 7 lines):

```typescript
export { Borehole } from './borehole';
export { Well } from './well';
export { Reservoir } from './reservoir';
export { WaterSupply } from './water-supply';
export { People } from './people';
export { WaterDrop } from './water-drop';
export { ArticleDotsIcon } from './article-dots-icon';
```

Add `export { TelegramIcon } from './telegram-icon';` following the identical single-line pattern. Confirm `src/shared/ui/index.ts` (the parent barrel) re-exports this icons barrel already (implied by `login-page.tsx`'s existing `import { PageContainer, FormField } from '@/shared/ui'` — check whether icons flow through the same top-level `shared/ui` barrel or must be imported from `@/shared/ui/icons` directly; match whatever `WaterDrop` currently does elsewhere in the codebase).

---

### `src/views/profile/ui/profile-page.tsx` (edit — VERIFY-03 resend row)

**Analog:** itself — the existing `Изменить почту` row (lines 42-55) and `Сменить пароль` row (lines 57-65)

**Analog excerpt (`Сменить пароль` row, lines 57-65 — closest shape: single-line label, no subtitle):**

```tsx
<Link href="/profile/change-password" className="block active:opacity-70">
    <div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
        <LockClosedIcon className="size-5 shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="font-semibold">Сменить пароль</h3>
        </div>
        <PencilSquareIcon className="size-5 shrink-0" />
    </div>
</Link>
```

**Key structural difference for the new row:** existing rows are `<Link>` wrapping a `div` (navigation to a sub-route). VERIFY-03's row is an **in-place action** (fire `resendVerification`, no navigation) — so the wrapper must be a `<button>` (or a `div` with `onClick`), not `<Link>`, and the trailing `PencilSquareIcon` (which signals "editable, click to navigate") should be dropped or replaced (no navigation is happening). Needs local `isSending`/`resendResult` state (RESEARCH.md Pitfall 4 — must disable while pending to prevent double-fire).

**Target pattern** (composing the existing row markup + `resendVerification` call + local pending state, follow the file's existing `'use client'` + `useAuthStore` import conventions at the top):

```tsx
import { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { resendVerification } from '@/features/auth';
// ... existing imports

const [isSending, setIsSending] = useState(false);
const [resendResult, setResendResult] = useState<'idle' | 'success' | 'error'>('idle');
const accessToken = useAuthStore((s) => s.accessToken);

async function handleResend() {
    if (!accessToken || isSending) return;
    setIsSending(true);
    setResendResult('idle');
    try {
        await resendVerification(accessToken);
        setResendResult('success');
    } catch {
        setResendResult('error');
    } finally {
        setIsSending(false);
    }
}

// JSX — new row, same p-4/bg-base-100/rounded-2xl/border shell as existing rows:
<div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
    <EnvelopeIcon className="size-5 shrink-0" />
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3 className="font-semibold">Подтвердить почту</h3>
        {resendResult === 'success' && <p className="text-xs text-success">Письмо отправлено</p>}
    </div>
    <button
        type="button"
        className="btn btn-sm btn-outline btn-primary"
        onClick={handleResend}
        disabled={isSending}
    >
        {isSending ? (
            <span className="loading loading-spinner loading-xs" />
        ) : (
            'Отправить письмо повторно'
        )}
    </button>
</div>;
```

`EnvelopeIcon` is already imported in this file (line 4) for the `Изменить почту` row — reuse the same import, no new heroicon import needed (UI-SPEC explicitly suggests `EnvelopeIcon` or checkmark variant; `EnvelopeIcon` is zero-cost since it's already imported).

**Note:** `useAuthStore` is already imported (line 5) as `useAuthStore, normalizeRuPhone, formatRuPhoneForView, useIsClient` — extend the destructure/selector usage, don't add a second import statement.

---

## Shared Patterns

### One-shot cross-navigation client signal (`sessionStorage` + layout-mounted listener)

**Source:** `src/features/auth/ui/session-expired-listener/session-expired-listener.tsx` (structural precedent), `src/shared/lib/hooks/use-form-draft.ts` (sessionStorage read/write convention — not re-read this pass, RESEARCH.md already cites its `getFormDraft`/`sessionStorage.getItem` shape as the precedent for polling-on-mount reads)
**Apply to:** `registration-notice-listener.tsx` (new), mount point in `(web)/layout.tsx`

### Status-gated backend-error-message exposure (OWASP A07)

**Source:** `src/views/auth/ui/forgot-password-page.tsx`, `onSubmit` catch block (lines 29-39)
**Apply to:** `login-page.tsx`'s `onSubmit` catch block (LOGIN-02)

### DaisyUI form-page shell (card/card-body/PageContainer)

**Source:** `src/views/auth/ui/login-page.tsx` lines 56-124, identical shell in `register-page.tsx` and `forgot-password-page.tsx`
**Apply to:** no new page this phase, but the Telegram-button insertion into `login-page.tsx` must preserve this shell exactly (no restructuring of the existing `card-body` layout)

### Existing-row markup for profile action rows

**Source:** `src/views/profile/ui/profile-page.tsx` lines 42-65 (`Изменить почту`, `Сменить пароль`)
**Apply to:** new VERIFY-03 resend row (adapted from `<Link>`-navigation shape to `<button>`-action shape)

### Custom SVG icon prop contract

**Source:** `src/shared/ui/icons/water-drop.tsx` (outline variant), barrel `src/shared/ui/icons/index.ts`
**Apply to:** `telegram-icon.tsx` (new)

## No Analog Found

None — every file in this phase's scope has a direct or near-direct analog already in the codebase (per RESEARCH.md's "Don't Hand-Roll" table, every genuine gap maps to an existing solved pattern). The only fully-prescriptive (analog-free) piece is the exact Telegram button JSX markup and the `TelegramIcon`'s specific paper-plane SVG path — both fully specified by `02-UI-SPEC.md` Component Inventory #1 rather than derived from an existing file, since no Telegram-branded UI exists anywhere in the codebase yet (expected — this is the one genuinely new surface this phase introduces, per RESEARCH.md Summary).

## Metadata

**Analog search scope:** `src/features/auth/`, `src/views/auth/`, `src/views/profile/`, `src/shared/ui/icons/`, `src/app/(web)/layout.tsx`
**Files scanned:** 11 (all read in full this session or in Phase 2 research; no file exceeded 2,000 lines, no offset/limit reads needed)
**Pattern extraction date:** 2026-07-03
