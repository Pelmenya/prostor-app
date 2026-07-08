# Phase 3: Telegram Login & Registration - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 13 (new + modified)
**Analogs found:** 13 / 13 (all have at least a role-match; the OIDC hook itself has no behavioral analog — see "No Analog Found")

## File Classification

| New/Modified File                                                                                   | Role                               | Data Flow                     | Closest Analog                                                                                                                              | Match Quality                       |
| --------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `src/features/auth/api/auth-api.ts` (EDIT — add `telegramNonce`/`telegramLogin`/`telegramRegister`) | service (API)                      | request-response              | same file, `webLogin`/`webRegister` functions                                                                                               | exact                               |
| `src/features/auth/lib/auth-schemas.ts` (EDIT — add `telegramRegisterSchema`)                       | model (validation)                 | transform                     | `register-page.tsx`'s local `registerSchema`                                                                                                | exact (minus password field)        |
| `src/features/auth/lib/telegram-registration.ts` (NEW)                                              | utility (sessionStorage lifecycle) | CRUD (storage)                | `src/features/auth/lib/registration-notice.ts` (key-constant pattern) + `src/shared/lib/hooks/use-form-draft.ts` (try/catch guard pattern)  | role-match, composed from 2 analogs |
| `src/features/auth/lib/use-telegram-oidc.ts` (NEW)                                                  | hook                               | event-driven (popup callback) | none — first OIDC/popup integration in codebase                                                                                             | no analog                           |
| `src/features/auth/ui/telegram-link-hint-listener/telegram-link-hint-listener.tsx` (NEW)            | component (one-shot listener)      | event-driven                  | `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx`                                                        | exact                               |
| `src/features/auth/ui/telegram-link-hint-listener/index.ts` (NEW)                                   | config (public API)                | —                             | `src/features/auth/ui/registration-notice-listener/index.ts`                                                                                | exact                               |
| `src/views/auth/ui/login-page.tsx` (EDIT — wire 5-state Telegram button)                            | component (view/form)              | request-response              | same file (its own disabled-button markup, lines 95-103)                                                                                    | exact                               |
| `src/views/auth/ui/login-page.test.tsx` (EDIT)                                                      | test                               | —                             | same file's existing `webLogin` mock-based tests                                                                                            | exact                               |
| `src/views/auth/ui/telegram-register-page.tsx` (NEW)                                                | component (view/form)              | request-response              | `src/views/auth/ui/register-page.tsx` (form/schema/consent shell) + `src/views/auth/ui/verify-email-page.tsx` (centered-status-card states) | role-match, composed from 2 analogs |
| `src/views/auth/ui/telegram-register-page.test.tsx` (NEW)                                           | test                               | —                             | `src/views/auth/ui/register-page.test.tsx` + `verify-email-page.test.tsx`                                                                   | role-match                          |
| `src/views/auth/index.ts` (EDIT — export `TelegramRegisterPage`)                                    | config (public API)                | —                             | same file's existing exports                                                                                                                | exact                               |
| `src/app/(web)/telegram-register/page.tsx` (NEW)                                                    | route (thin wrapper)               | —                             | `src/app/(web)/register/page.tsx` (or equivalent thin wrapper for any auth route)                                                           | exact                               |
| `src/proxy.ts` (EDIT — add `/telegram-register` to `AUTH_ONLY`)                                     | middleware                         | request-response              | same file, `AUTH_ONLY` array (line 14)                                                                                                      | exact                               |
| `src/views/profile/ui/profile-page.tsx` (EDIT — new disabled "Привязать Telegram" row)              | component (view)                   | request-response              | same file's existing "Подтвердить почту" row (lines 92-112)                                                                                 | exact                               |
| `src/views/profile/ui/profile-page.test.tsx` (EDIT)                                                 | test                               | —                             | same file's existing resend-row tests                                                                                                       | exact                               |

## Pattern Assignments

### `src/features/auth/api/auth-api.ts` (service, request-response)

**Analog:** same file, `webLogin`/`webRegister` (lines 10-30)

**Core pattern** (lines 10-30):

```typescript
export async function webRegister(body: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    policyVersion: string;
    pdAgreementVersion: string;
}): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/web/register', {
        method: 'POST',
        body,
    });
}

export async function webLogin(body: { email: string; password: string }): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/web/login', {
        method: 'POST',
        body,
    });
}
```

`TAuthResponse` (lines 4-8) is already exported from this file and must be reused verbatim as the success-branch return type for `telegramLogin`/`telegramRegister` (per RESEARCH.md's `TTelegramLoginResponse = TAuthResponse | { registrationRequired: true; ... }` union). No `auth` header needed for any of the three new functions (`telegramNonce`, `telegramLogin`, `telegramRegister`) — same as `webLogin`/`webRegister`, unauthenticated endpoints. Group the three new functions under a `// ─── Telegram ──` comment banner, matching the existing `// ─── Пароль и email ──` / `// ─── Профиль ──` section-divider convention already used in this file (lines 40, 86).

---

### `src/features/auth/lib/auth-schemas.ts` (model, transform)

**Analog:** `register-page.tsx`'s local `registerSchema` (lines 25-39) — RESEARCH.md's own Code Examples section already drafted the target `telegramRegisterSchema` verbatim (lines 508-520 of 03-RESEARCH.md); copy it as-is.

**Core pattern** (register-page.tsx lines 25-39):

```typescript
const phoneE164Ru = /^\+7\d{10}$/;

const registerSchema = z.object({
    first_name: z.string().trim().min(1, 'Имя обязательно'),
    last_name: z.string().trim().min(1, 'Фамилия обязательна'),
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    phone: z.string().regex(phoneE164Ru, 'Введите номер в формате +7 999 999-99-99'),
    password: z.string().min(8, 'Минимум 8 символов'),
    agreePolicy: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие с политикой конфиденциальности',
    }),
    agreePd: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие на обработку персональных данных',
    }),
});
```

**Delta for `telegramRegisterSchema`:** identical field set minus `password`. Currently `phoneE164Ru` is a local `const` inside `register-page.tsx`, not exported from `auth-schemas.ts` — since this phase is adding a second schema needing the exact same regex, hoist `phoneE164Ru` into `auth-schemas.ts` as a shared exported constant (avoids the duplication RESEARCH.md flags in its Code Examples comment) and have `register-page.tsx` import it back, OR duplicate the one-liner regex if minimal-diff is preferred — either is acceptable, but do not let the two regexes drift.

---

### `src/features/auth/lib/telegram-registration.ts` (utility, storage lifecycle)

**Analog 1 — key-constant single-source-of-truth shape:** `src/features/auth/lib/registration-notice.ts` (full file, 8 lines):

```typescript
export const REGISTRATION_NOTICE_FLAG_KEY = 'reg-notice-pending';
```

**Analog 2 — try/catch storage guard + get/set pattern:** `src/shared/lib/hooks/use-form-draft.ts` (lines 10-18, 52-56):

```typescript
export function getFormDraft<T>(key: string): Partial<T> | null {
    if (typeof window === 'undefined') return null;
    try {
        const saved = sessionStorage.getItem(key);
        return saved ? (JSON.parse(saved) as Partial<T>) : null;
    } catch {
        return null;
    }
}
// ...
try {
    sessionStorage.setItem(key, JSON.stringify(toSave));
} catch {
    // тихо игнорируем — QuotaExceededError в приватном режиме Safari
}
```

**Composition for the new file:** RESEARCH.md's Pattern 2 (lines 300-346 of 03-RESEARCH.md) already drafts the exact target shape (`TELEGRAM_REG_TOKEN_KEY`/`TELEGRAM_REG_PROFILE_KEY`/`TELEGRAM_REG_ISSUED_AT_KEY` constants + `setTelegramRegistration`/`readTelegramRegistration`/`clearTelegramRegistration` functions, each wrapped in try/catch, fail-closed on any throw). Follow it verbatim — it is already a faithful merge of these two analogs' conventions (constant-first exports like `registration-notice.ts`, try/catch-per-operation like `use-form-draft.ts`).

**Error handling pattern:** fail-closed — any thrown/missing/stale value returns `null` from `readTelegramRegistration()`, which the page then treats identically to "no token" (TG-03 restart state). Never let a storage exception propagate to the caller.

---

### `src/features/auth/ui/telegram-link-hint-listener/*` (component, event-driven one-shot listener)

**Analog:** `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` (full file, 62 lines) + its `index.ts`

**Imports pattern** (lines 1-5):

```tsx
'use client';

import { useState } from 'react';
import { useIsClient } from '@/shared/lib';
import { REGISTRATION_NOTICE_FLAG_KEY as FLAG_KEY } from '../../lib/registration-notice';
```

**Core pattern — SSR-safe one-shot flag read + dismiss** (lines 14-51):

```tsx
function readFlag(): boolean {
    try {
        return sessionStorage.getItem(FLAG_KEY) === '1';
    } catch {
        return false;
    }
}

export function RegistrationNoticeListener() {
    const mounted = useIsClient();
    const [dismissed, setDismissed] = useState(false);

    if (!mounted || dismissed) return null;

    const visible = readFlag();
    if (!visible) return null;

    function dismiss() {
        try {
            sessionStorage.removeItem(FLAG_KEY);
        } catch {
            // тихо игнорируем — недоступность storage не должна ронять layout
        }
        setDismissed(true);
    }

    return (/* alert-info markup */);
}
```

**Adaptation for `TelegramLinkHintListener`:** UI-SPEC §4 does not need a dismissible top-of-page banner — it needs a _boolean_ consumed by `profile-page.tsx` to conditionally render a row, and per UI-SPEC/RESEARCH the flag must be "cleared after first read" (one-shot). Two viable shapes, planner's call: (a) export this as a component exactly like the analog but rendering the disabled row itself (then `profile-page.tsx` just drops `<TelegramLinkHintListener />` in among its other rows), or (b) export a `useTelegramLinkHint()` hook that returns the boolean + handles the one-shot clear, and `profile-page.tsx` renders the row inline using its own existing row markup (matches `profile-page.tsx`'s current all-inline-JSX style better, no per-row extracted components exist there today). Either way, the `useIsClient` + try/catch + clear-on-read mechanics must be copied verbatim from this analog — do not invent a new storage-guard pattern.

**`index.ts` pattern** (public API, mirror `registration-notice-listener/index.ts`):

```typescript
export { RegistrationNoticeListener } from './registration-notice-listener';
```

---

### `src/features/auth/lib/use-telegram-oidc.ts` (hook, event-driven — no existing analog)

No behavioral precedent exists in this codebase (confirmed: `TelegramAdapter`/`mock-telegram-env.ts` are the unrelated Mini App SDK, explicitly not reusable per RESEARCH.md). Use RESEARCH.md's own Pattern 1 code example (03-RESEARCH.md lines 236-297) as the implementation template — it is already written against this project's conventions (`'use client'`, `useCallback`/`useState`, calls the sibling `telegramNonce()` API function). Structural conventions to keep consistent with the rest of the codebase even though the OIDC mechanic itself is new:

- File location/naming: `src/features/auth/lib/use-*.ts` matches the existing `src/features/auth/lib/use-logout.ts` naming convention (hook lives in `lib/`, not a separate `hooks/` folder, within this feature slice).
- Export via `src/features/auth/index.ts` public API, same as every other `features/auth` hook/function.

---

### `src/views/auth/ui/login-page.tsx` (component, request-response) — EDIT

**Analog:** same file, current disabled Telegram button (lines 95-103):

```tsx
<button
    type="button"
    className="btn btn-outline btn-primary w-full gap-2"
    disabled
    title="Появится после запуска Telegram-входа"
>
    <TelegramIcon className="size-5" />
    Войти через Telegram
</button>
```

**Replace with the 5-state machine.** Reuse this file's own `serverError` alert pattern (lines 17, 33-51, 78) for the Telegram error state — UI-SPEC explicitly says the Telegram error alert goes "in the same slot the existing `serverError` alert uses." Reuse this file's own spinner-in-button pattern (lines 85-89, the email-submit button's `isSubmitting` ternary) for the 3 in-flight Telegram states:

```tsx
{
    isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Войти';
}
```

Do **not** wire the Telegram button's `disabled` state to the email form's `isSubmitting` (or vice versa) — UI-SPEC/RESEARCH both require the two entry points to stay independent (a user can abandon the Telegram popup and still use email login without reload).

**Redirect/session pattern to reuse verbatim on success** (lines 36-40):

```typescript
setTokens(data.accessToken, data.refreshToken);
setUser(data.user);
resetSessionExpiredNotified();
router.push(getSafeRedirect(searchParams.get('from')));
```

**`registrationRequired` branch** — no existing analog for the sessionStorage-write-then-redirect shape _inside this file_, but `register-page.tsx` line 165's post-success `sessionStorage.setItem(REGISTRATION_NOTICE_FLAG_KEY, '1')` immediately before its own `router.push` is the direct structural precedent for "write a flag/storage-blob to sessionStorage right before navigating away."

---

### `src/views/auth/ui/telegram-register-page.tsx` (component, request-response) — NEW

**Analog 1 — form/schema/consent shell:** `src/views/auth/ui/register-page.tsx` (full file read, 306 lines)

**Imports pattern** (lines 1-23) — same import shape to follow (RHF + zodResolver + zod-inferred type + shared/lib barrel + shared/ui barrel):

```tsx
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFormContext, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { webRegister, REGISTRATION_NOTICE_FLAG_KEY } from '@/features/auth';
import { ApiError, resetSessionExpiredNotified } from '@/shared/api';
import { useAuthStore, extractErrorMessage, getSafeRedirect } from '@/shared/lib';
import { PageContainer, FormField } from '@/shared/ui';
```

**`ConsentCheckboxes` component** (lines 43-100) — UI-SPEC explicitly requires pixel-identical reuse; extract-vs-duplicate is discretionary but the markup below must not be restyled:

```tsx
function ConsentCheckboxes() {
    const {
        register,
        formState: { errors },
    } = useFormContext<TRegisterForm>();
    return (
        <div className="flex flex-col w-full gap-3">
            <div>
                <label className="flex items-start gap-2 cursor-pointer w-full">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-0.5"
                        {...register('agreePolicy')}
                    />
                    <span className="text-sm leading-snug">
                        Принимаю{' '}
                        <a
                            href="/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link text-primary underline"
                        >
                            политику конфиденциальности
                        </a>
                    </span>
                </label>
                {errors.agreePolicy && (
                    <p className="text-error text-xs mt-1">{errors.agreePolicy.message}</p>
                )}
            </div>
            {/* agreePd block — identical shape, different copy/link */}
        </div>
    );
}
```

Currently a private (unexported) function inside `register-page.tsx` — if extracting, a natural location is `src/features/auth/ui/consent-checkboxes/` (new FSD slice-internal component) re-exported through `src/features/auth/index.ts`; if duplicating, paste verbatim into `telegram-register-page.tsx` unchanged.

**Form-submit error-handling pattern** (lines 143-174):

```typescript
const onSubmit = async (form: TRegisterForm) => {
    setServerError(null);
    try {
        const data = await webRegister({
            /* ... */
        });
        clearDraft();
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        resetSessionExpiredNotified();
        sessionStorage.setItem(REGISTRATION_NOTICE_FLAG_KEY, '1');
        router.push(getSafeRedirect(searchParams.get('from')));
    } catch (err) {
        if (err instanceof ApiError) {
            setServerError(extractErrorMessage(err.data, 'Ошибка регистрации'));
        } else {
            setServerError('Ошибка сети');
        }
    }
};
```

For `telegram-register-page.tsx`, this `catch` block's shape becomes the 3-way branch from RESEARCH.md Pattern 3: `err instanceof ApiError && err.status === 409` → TG-04 (clear token, write `login-form-draft`, write `TELEGRAM_LINK_HINT_FLAG_KEY`, render conflict state); any other `ApiError`/network error → TG-03 (clear token, render restart state). No `login-form-draft` write helper exists yet as a named export — reuse the existing mechanism `login-page.tsx` already reads via `getFormDraft<TLoginForm>('login-form-draft')` (line 19 of `login-page.tsx`) by calling `sessionStorage.setItem('login-form-draft', JSON.stringify({ email }))` directly, matching the literal string key already in use — do not introduce a new constant name for this specific key per UI-SPEC's explicit "no new storage key" instruction.

**Analog 2 — centered dead-end status-card states (TG-03/TG-04):** `src/views/auth/ui/verify-email-page.tsx` (full file, 124 lines)

**Core pattern** (lines 70-110):

```tsx
<div className="card bg-base-200 shadow-xl w-full max-w-md">
    <div className="card-body items-center text-center">
        {status === 'error' && (
            <>
                <div className="text-5xl mb-4">❌</div>
                <h1 className="card-title text-2xl">Ошибка</h1>
                <div className="alert alert-error text-sm mt-4">{errorMessage}</div>
                <Link href="/login" className="btn btn-primary w-full mt-4">
                    Войти
                </Link>
            </>
        )}
    </div>
</div>
```

Use `card-body items-center text-center` + a `STATUS_CONFIG`-style lookup object (lines 13-27) as the direct precedent for TG-03/TG-04's two named states — UI-SPEC explicitly cites this file's alignment convention as the one to reuse rather than inventing a new centered-card layout. Note UI-SPEC's TG-03/TG-04 markup uses `text-error` heading + `btn btn-primary` CTA (not the emoji icon) — copy the _structural_ pattern (centered card, status lookup object, single CTA button) not the emoji glyphs.

**Avatar pattern (TG-02 prefilled profile display):** `src/entities/user/ui/curator-master-card/curator-master-card.tsx` (lines 1-6, 20-24, 32-41):

```tsx
import Image from 'next/image';
import { formatUserInitials } from '@/shared/lib';
// ...
const initials = formatUserInitials(user.first_name, user.last_name);
const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';
// ...
<div className={`avatar shrink-0 ${!user.photo_url ? 'avatar-placeholder' : ''}`}>
    <div
        className={`relative size-10 rounded-full overflow-hidden ${!user.photo_url ? 'bg-primary/10 text-primary' : ''}`}
    >
        {user.photo_url ? (
            <Image src={user.photo_url} alt={fullName} fill className="object-cover" />
        ) : (
            <span className="text-sm font-semibold">{initials}</span>
        )}
    </div>
</div>;
```

UI-SPEC's `size-20`/`text-xl` completion-form avatar (§Component Inventory #2) is a direct proportional scale-up of this exact markup (`size-10`/`text-sm` here) — same conditional-classname structure, same `formatUserInitials` import from `@/shared/lib`, same `next/image` `fill`+`object-cover` usage. `formatUserInitials` signature confirmed at `src/shared/lib/format/format-user-initials.ts` (used as `formatUserInitials(first_name, last_name)`).

---

### `src/app/(web)/telegram-register/page.tsx` (route, thin wrapper) — NEW

**Analog:** any existing `src/app/(web)/{auth-route}/page.tsx` thin wrapper (e.g. `register/page.tsx`) — standard project-wide convention per CLAUDE.md ("`page.tsx` files — тонкие обёртки, импортирующие готовую страницу из `src/views/`"). Expected shape:

```tsx
import { TelegramRegisterPage } from '@/views/auth';

export default function Page() {
    return <TelegramRegisterPage />;
}
```

---

### `src/proxy.ts` (middleware, request-response) — EDIT

**Analog:** same file, `AUTH_ONLY` array (line 14):

```typescript
const AUTH_ONLY = ['/login', '/register', '/forgot-password', '/reset-password'];
if (token && AUTH_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
```

One-line addition: append `'/telegram-register'` to this array. No other logic change needed — the `.some((p) => pathname === p || ...)` matcher already generalizes.

---

### `src/views/profile/ui/profile-page.tsx` (component, request-response) — EDIT

**Analog:** same file, "Подтвердить почту" row (lines 92-112) — closest structural match (a conditionally-rendered informational row with an action, vs. the plain navigation rows above it):

```tsx
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
        {/* ... */}
    </button>
</div>
```

**New disabled row per UI-SPEC §4** — same `p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4` shell, but disabled/no-action:

```tsx
<div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
    <TelegramIcon className="size-6 text-base-content/40 shrink-0" />
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3 className="font-semibold text-base-content/40">Привязать Telegram</h3>
    </div>
    <button
        type="button"
        className="btn btn-sm btn-outline btn-primary"
        disabled
        title="Появится после запуска привязки Telegram в следующем обновлении"
    >
        Привязать
    </button>
</div>
```

This mirrors the exact "disabled honest-affordance" precedent `login-page.tsx`'s own current Telegram button used before this phase (lines 95-103 above) — same `disabled` + `title` tooltip idiom, just applied to a profile row instead of a button. Rendering condition: wrap in the `TelegramLinkHintListener`/`useTelegramLinkHint()` one-shot check (see that section above) — only shown once, only after a TG-04 conflict-then-email-login arrival. `TelegramIcon` import already available from `@/shared/ui`, same barrel `login-page.tsx` uses (line 11 of `login-page.tsx`).

## Shared Patterns

### sessionStorage try/catch guard (fail-closed)

**Source:** `src/shared/lib/hooks/use-form-draft.ts` (lines 10-18, 52-56), `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` (lines 14-20, 44-49)
**Apply to:** `telegram-registration.ts` (all 3 functions), `telegram-link-hint-listener.tsx`, and the TG-04 branch in `telegram-register-page.tsx` (writing `login-form-draft` + `TELEGRAM_LINK_HINT_FLAG_KEY`)

```typescript
try {
    sessionStorage.setItem(key, value);
} catch {
    // тихо игнорируем — недоступность storage не должна ронять UI
}
```

### One-shot cross-navigation sessionStorage flag

**Source:** `src/features/auth/lib/registration-notice.ts` + `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` (full pattern: exported key constant + `useIsClient`-gated read + clear-on-dismiss)
**Apply to:** `TELEGRAM_LINK_HINT_FLAG_KEY` lifecycle (`telegram-registration.ts` constant + new `telegram-link-hint-listener`)

### Post-auth-success token/redirect sequence

**Source:** `src/views/auth/ui/login-page.tsx` (lines 36-40), `register-page.tsx` (lines 161-166)
**Apply to:** TG-01 success branch (`login-page.tsx`), TG-02 success branch (`telegram-register-page.tsx`)

```typescript
setTokens(data.accessToken, data.refreshToken);
setUser(data.user);
resetSessionExpiredNotified();
router.push(getSafeRedirect(searchParams.get('from')));
```

### `ApiError`-typed error branching

**Source:** `src/views/auth/ui/login-page.tsx` (lines 41-51), `register-page.tsx` (lines 167-173)
**Apply to:** `telegram-register-page.tsx`'s TG-03/TG-04 branch (extend the `err instanceof ApiError` check with a `.status === 409` sub-branch per RESEARCH.md Pattern 3)

```typescript
} catch (err) {
    if (err instanceof ApiError && err.status === 409) {
        // TG-04
    } else if (err instanceof ApiError) {
        // TG-03 — restart
    } else {
        // TG-03 — network error, restart
    }
}
```

### Card shell / `PageContainer` + `Suspense` wrapper

**Source:** every `src/views/auth/ui/*-page.tsx` file (identical `PageContainer` > `flex items-center justify-center min-h-[60vh]` > `Suspense` > inner `*Form` component export shape)
**Apply to:** `telegram-register-page.tsx`'s top-level `TelegramRegisterPage` export

```tsx
export function TelegramRegisterPage() {
    return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Suspense fallback={<span className="loading loading-spinner loading-lg" />}>
                    <TelegramRegisterForm />
                </Suspense>
            </div>
        </PageContainer>
    );
}
```

## No Analog Found

| File                                         | Role | Data Flow                     | Reason                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ---- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/auth/lib/use-telegram-oidc.ts` | hook | event-driven (popup callback) | First Telegram web-OIDC integration in this codebase; `TelegramAdapter`/`mock-telegram-env.ts` are a different Telegram surface (Mini App SDK) with zero code-reuse potential. Use RESEARCH.md's own Pattern 1 code example (03-RESEARCH.md lines 236-297) as the implementation template instead of a codebase analog — it was purpose-written against this project's conventions this session. |

## Metadata

**Analog search scope:** `src/views/auth/`, `src/features/auth/`, `src/views/profile/`, `src/entities/user/ui/curator-master-card/`, `src/shared/lib/hooks/`, `src/proxy.ts`
**Files scanned:** 29 (full directory listing of `src/views/auth`, `src/features/auth`, `src/views/profile`) + 5 read in full for excerpt extraction (`login-page.tsx`, `register-page.tsx`, `verify-email-page.tsx`, `registration-notice.ts`, `registration-notice-listener.tsx`) + 3 targeted reads (`use-form-draft.ts`, `profile-page.tsx`, `curator-master-card.tsx` header, `auth-api.ts`, `proxy.ts` grep)
**Pattern extraction date:** 2026-07-06
