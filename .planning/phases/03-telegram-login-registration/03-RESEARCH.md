# Phase 3: Telegram Login & Registration - Research

**Researched:** 2026-07-04
**Domain:** First-time integration of Telegram's OIDC ("Login Widget v2") web login flow into a Next.js 16 / React 19 FSD app that already has a fully-working email JWT auth flow (Phase 1/2) and a disabled Telegram-button placeholder
**Confidence:** MEDIUM — architecture/composition against the existing codebase is HIGH (direct source reads); the exact Telegram OIDC wire contract and the backend's `/auth/telegram/*` response shapes are MEDIUM/LOW because the backend repo (`crm-aqua-kinetics-back`) is not present on this machine and could not be inspected this session (same limitation Phase 2's research flagged for `/auth/web/login`)

<user_constraints>

## User Constraints (from 03-UI-SPEC.md)

No CONTEXT.md exists yet for this phase (same situation as Phase 2 — UI-SPEC was generated directly from ROADMAP/PROJECT/REQUIREMENTS, status: draft, approval pending in this file's own checklist). Treat `03-UI-SPEC.md`'s already-locked decisions (copy strings, route name `/telegram-register`, spacing/color/typography, component markup) as binding constraints for planning, same authority CONTEXT.md decisions would carry.

### Locked Decisions (from 03-UI-SPEC.md)

- Route: `/telegram-register` — flat top-level route (sibling of `/verify-email`, `/reset-password`), **not** nested under `/register`.
- New view: `src/views/auth/ui/telegram-register-page.tsx`; thin wrapper `src/app/(web)/telegram-register/page.tsx`.
- Telegram button on `login-page.tsx`: 5-state machine (idle → nonce-loading → awaiting-popup → exchanging → error-back-to-idle). Exact copy strings for each state are locked (see UI-SPEC Copywriting Contract) — planner must not paraphrase.
- TG-02 completion form: avatar (`size-20`, `avatar-placeholder` fallback with `formatUserInitials`), Имя/Фамилия prefilled+editable, Email + Телефон required empty, `ConsentCheckboxes` reused verbatim from `register-page.tsx` (extract-or-duplicate is planner's call, but pixel-identical), **no password field**, submit CTA "Завершить регистрацию" (deliberately not "Создать аккаунт").
- TG-03/TG-04 states **replace the entire form** (not shown alongside it) — centered-text card variant, modeled on `verify-email-page.tsx`'s `STATUS_CONFIG` alignment convention.
- TG-04 email-conflict CTA reuses `login-form-draft` sessionStorage mechanism (`useFormDraft`/`getFormDraft`) to pre-fill the conflicting email on `/login` — **no new storage key** for that specific hand-off.
- TG-04 tail-end "Привязать Telegram" affordance: disabled row on `profile-page.tsx`, only rendered when the user arrived via the TG-04 conflict-then-email-login path (one-shot sessionStorage flag, name it `TELEGRAM_LINK_HINT_FLAG_KEY`, same pattern as `REGISTRATION_NOTICE_FLAG_KEY`/`RegistrationNoticeListener`). **Flagged by UI-SPEC itself as an overridable discretion call** — actual linking round-trip is Phase 4 (LINK-01), this phase only ships the disabled hint.
- Do not disable the email-login form while the Telegram button is mid-flow — the two entry points must stay independent.

### Claude's Discretion

- Whether `ConsentCheckboxes` is extracted to a shared location or duplicated verbatim into the new file (UI-SPEC explicitly leaves this open, "either is acceptable to this design contract").
- Exact internal architecture of the OIDC hook/state-machine (UI-SPEC only specifies visual states, not implementation) — this is squarely this RESEARCH.md's job to resolve, see Architecture Patterns below.
- Whether `/telegram-register` is added to `proxy.ts`'s `AUTH_ONLY` redirect-away-if-logged-in array (not mentioned in UI-SPEC at all — see Common Pitfalls).

### Deferred Ideas (OUT OF SCOPE)

Per REQUIREMENTS.md `## Out of Scope` and ROADMAP phase boundary: the actual Telegram **linking** round-trip (`POST /auth/telegram/link`, LINK-01/LINK-02) is Phase 4 — this phase ships only the disabled hint affordance. Password-management for telegram-only accounts (PASS-01..03) is also Phase 4. NextAuth, Яндекс ID OAuth, magic link, Telegram/MAX Mini App view layers remain cancelled/frozen per PROJECT.md — none of this phase's work touches `TelegramAdapter`/`(miniapp)`.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                                                                                                    | Research Support                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TG-01 | Existing-user login: nonce (`POST /auth/telegram/nonce`) → Telegram Login OIDC → `id_token` → `POST /auth/telegram/login` → tokens stored, redirect to cabinet | **Genuinely new code.** No prior OIDC/widget integration exists anywhere in this codebase — `TelegramAdapter`/`mock-telegram-env.ts` are the _Mini App_ SDK (`@tma.js/sdk-react`, `initData`), a completely different Telegram surface/API with no code reuse potential beyond "same brand, same icon." See Architecture Patterns Pattern 1 and Common Pitfalls 1-3 for the concrete widget-loading + popup-timing design. |
| TG-02 | New profile (`registrationRequired: true`) → completion form, `POST /auth/telegram/register`                                                                   | New route + new view, UI-SPEC fully locks the markup (see above). Backend contract for the response body carrying `registrationRequired`/`registrationToken`/`profile` is `[ASSUMED]` shape — not verified against backend source this session (see Assumptions Log A1).                                                                                                                                                   |
| TG-03 | `registrationToken` — `sessionStorage`-only, one-time, 10-min TTL; expiry/ambiguous error → restart whole flow                                                 | New sessionStorage lifecycle to design from scratch (no exact precedent, but composes from two existing patterns: `REGISTRATION_NOTICE_FLAG_KEY`'s one-shot flag shape and `use-form-draft.ts`'s try/catch sessionStorage-access guard). See Architecture Patterns Pattern 2.                                                                                                                                              |
| TG-04 | Email-conflict on register → no duplicate account, redirect to email login + offer "Привязать Telegram"                                                        | Redirect-with-prefill reuses `login-form-draft` mechanism (already built, Phase 2/1). Detection logic (how the frontend distinguishes "email taken" from "ambiguous error") is backend-contract-dependent — see Common Pitfalls 6 and Assumptions Log A2.                                                                                                                                                                  |

</phase_requirements>

## Summary

This phase is the **first genuinely new integration surface** in the whole GSD milestone — Phases 1 and 2 were "audit and harden" work against code that already existed pre-milestone; Phase 3 has almost no existing code to extend beyond the disabled button and `TelegramIcon` that Phase 2 already shipped as a placeholder. There is a critical distinction the planner must not blur: this codebase already has **two unrelated things both called "Telegram"** —

1. **`TelegramAdapter`** (`src/shared/lib/platform/adapters/telegram-adapter.ts`) — the _Mini App_ SDK (`@tma.js/sdk-react`), reading `initData`/`initDataRaw` inside an actual Telegram client webview. This is the **frozen miniapp code** per PROJECT.md/CLAUDE.md — do not touch, do not reuse its mocking helpers (`mock-telegram-env.ts`'s `mockTelegramEnv` mocks a completely different global shape than what this phase needs).
2. **Telegram Login Widget / OIDC** (`login.telegram.org`, `Telegram.Login.auth()`) — a **browser-only, popup-based OAuth2/OIDC flow** for logging into a _website_ with a Telegram account, run from an ordinary desktop/mobile browser tab, with zero relationship to the Mini App SDK. This is what TG-01..04 actually need, and nothing in the codebase implements any part of it yet.

**The wire contract, confirmed against Telegram's own documentation this session:** Telegram's current ("new OIDC flow", rolled out 2024-2025) web login exposes a JS global `Telegram.Login.auth(options, callback)` after loading `https://telegram.org/js/telegram-widget.js` (exact version query param must be copied from the live snippet BotFather/`core.telegram.org/widgets/login` generates at execution time — treat the specific `?NN` suffix as `[ASSUMED]`, verify against the current widget-customizer page before shipping). `options` accepts `{ client_id, scope?: ('profile'|'phone'|'write')[], lang?, nonce? }`; the callback receives `{ id_token, user, error }` — `id_token` is a signed JWT (RS256 by default) containing the requested claims; `nonce`, if supplied, is echoed inside the `id_token` payload specifically to prevent replay `[CITED: core.telegram.org/bots/telegram-login]`. This maps **exactly** onto this project's backend contract: `POST /auth/telegram/nonce` gives the frontend a server-generated nonce, that nonce is passed into `Telegram.Login.auth({ nonce, ... })`, the resulting `id_token` is POSTed to `POST /auth/telegram/login` (or `/register`), and the backend is the only party that ever needs to cryptographically verify the JWT and cross-check the embedded nonce against the one it issued.

**Two hard, non-obvious technical risks this phase must design around, both already anticipated by UI-SPEC's copy contract (which is a good sign the UI design already assumed these failure modes exist):**

1. **Popup-blocker / user-activation timing.** `Telegram.Login.auth()` opens a **popup window** internally. Browsers only bypass popup blockers for `window.open()` calls made synchronously inside a user-gesture handler (click). This phase's flow is: click → **await** nonce fetch → _then_ call `Telegram.Login.auth()`. That `await` consumes the transient "user activation" flag in some browsers (Safari is the strictest), so the popup can be blocked **even though the user did click the button** — not a bug, an inherent consequence of needing a network round-trip before opening the popup. UI-SPEC already has a dedicated "Разрешите всплывающие окна…" error string for exactly this case, so the design already accounts for it; the implementation should not attempt anything exotic (like a pre-opened `about:blank` popup manually navigated later — `Telegram.Login.auth()` doesn't expose that level of control) and should instead **minimize the click-to-`auth()` gap** (see Common Pitfalls 1) and treat popup-blocked as an expected, handled outcome, not a bug to eliminate entirely.
2. **`Cross-Origin-Opener-Policy: same-origin`.** Telegram's own docs explicitly warn that serving this header on the page hosting the login button **breaks** the popup flow (it severs the `window.opener` link the widget's callback relies on) `[CITED: core.telegram.org/bots/telegram-login]`. This project's `next.config.ts` does not currently set any `headers()`/COOP config — confirmed by direct read — so there is no existing conflict, but this is a **do-not-introduce-later** constraint worth flagging loudly for any future security-hardening phase (e.g. a CSP/security-headers phase) that might reflexively add `same-origin` COOP as a hardening measure without knowing it would silently break Telegram login.

**Primary recommendation:** Build one small, reusable low-level utility (`requestTelegramIdToken` or similar) in `features/auth/lib/` that owns exactly the "load script once → fetch nonce → call `Telegram.Login.auth()` → resolve with `{ idToken } | { error }`" concern, decoupled from what happens with that `id_token` afterward. TG-01's `login-page.tsx` button and TG-02's registration-completion POST both consume this utility's output, and — because LINK-01 (Phase 4) needs the **identical** nonce→popup→id_token mechanic just aimed at a different backend endpoint (`/auth/telegram/link`) — this phase should not hard-code the utility's output handling in a way Phase 4 has to duplicate. Everything downstream of getting the `id_token` (which backend endpoint to call, how to branch on `registrationRequired`, where to redirect) is genuinely new Phase-3-only code with no existing pattern to clone — unlike Phase 2, where nearly every gap had a sibling file to copy from, here only the **sessionStorage-lifecycle mechanics** (one-shot flags, try/catch guards, form-draft prefill) have direct precedent; the **OIDC integration itself** does not, and should be treated as new, carefully-tested surface area, not a "clone an existing pattern" task.

## Architectural Responsibility Map

| Capability                                                 | Primary Tier                                                                     | Secondary Tier                                                               | Rationale                                                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nonce issuance                                             | API / Backend (`POST /auth/telegram/nonce`)                                      | —                                                                            | Nonce must be unpredictable and single-use from the server's perspective; frontend only relays it into the widget call                                                                                    |
| Telegram OIDC popup + `id_token` acquisition               | Browser / Client (new `features/auth` hook/utility)                              | External service (`oauth.telegram.org`/`telegram.org` widget script)         | Runs entirely in the browser via Telegram's own hosted script; the frontend's only job is to load the script, pass `client_id`/`nonce`, and relay the resulting `id_token`                                |
| `id_token` cryptographic verification + nonce cross-check  | API / Backend (`POST /auth/telegram/login`/`register`)                           | —                                                                            | Frontend must never attempt to validate or trust the `id_token`'s claims itself — it is an opaque bearer credential from the frontend's point of view, exactly like `verify-email`'s token                |
| Existing-user login branch (TG-01)                         | Browser / Client (extend `login-page.tsx`)                                       | API / Backend (`POST /auth/telegram/login`)                                  | Same shape as `webLogin` — client stores whatever tokens backend returns, no new session-management logic (Phase 1 already owns that)                                                                     |
| New-user registration-completion form (TG-02)              | Browser / Client (new `telegram-register-page.tsx`)                              | API / Backend (`POST /auth/telegram/register`, consent-version validation)   | Client validates shape/format only (RHF + Zod), same division of labor as `register-page.tsx`                                                                                                             |
| `registrationToken` lifecycle / one-time-use / TTL (TG-03) | Browser / Client (`sessionStorage`, new lifecycle helper)                        | API / Backend (authoritative TTL/one-time enforcement)                       | Client-side TTL check is a UX nicety only (avoid a doomed API round-trip); backend is the only party that can actually enforce single-use, since sessionStorage state is trivially resettable by the user |
| Email-conflict detection + redirect (TG-04)                | Browser / Client (error-branching in the registration-completion submit handler) | API / Backend (must signal "email taken" distinguishably from other 4xx/5xx) | Frontend can only branch correctly if the backend response is distinguishable — see Common Pitfalls 6                                                                                                     |
| Post-conflict "Привязать Telegram" hint                    | Browser / Client (`profile-page.tsx`, one-shot sessionStorage flag)              | —                                                                            | Purely presentational this phase, mirrors `RegistrationNoticeListener`'s exact shape                                                                                                                      |

## Standard Stack

### Core

No new npm dependencies required — the Telegram OIDC widget is consumed as a third-party `<script>` (native browser global `window.Telegram.Login`), not an installable package.

| Library                       | Version (installed)                             | Purpose                                                   | Why Standard (for this codebase)                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| next (built-in `next/script`) | 16.1.6 [VERIFIED: package.json]                 | Load `telegram-widget.js` once, idempotently, client-side | Project already uses Next.js's own script-loading primitives elsewhere for client concerns (`RegisterSW`); no third-party script-loader precedent exists yet in this repo, but `next/script` is the framework-native, zero-dependency way to do this — do not hand-roll a `document.createElement('script')` injector |
| react-hook-form               | 7.71.2 [VERIFIED: package.json]                 | TG-02 completion form                                     | Same convention as all 5 existing auth forms                                                                                                                                                                                                                                                                          |
| zod                           | 4.3.6 [VERIFIED: package.json]                  | New `telegramRegisterSchema`                              | Same convention                                                                                                                                                                                                                                                                                                       |
| @hookform/resolvers           | 5.2.2 [VERIFIED: package.json]                  | `zodResolver` glue                                        | Same convention                                                                                                                                                                                                                                                                                                       |
| zustand                       | 5.0.11 [VERIFIED: package.json]                 | `useAuthStore` — unchanged, same `setTokens`/`setUser`    | No new store needed                                                                                                                                                                                                                                                                                                   |
| next/image                    | 16.1.6 [VERIFIED: package.json, next.config.ts] | TG-02 avatar (`profile.photo_url`)                        | `next.config.ts` already whitelists `**.telegram.org`/`t.me`/`**.t.me` remote patterns — confirmed present, no config change needed                                                                                                                                                                                   |

### Supporting

| Library         | Version | Purpose | When to Use |
| --------------- | ------- | ------- | ----------- |
| (none required) | —       | —       | —           |

### Alternatives Considered

| Instead of                                                                                                                          | Could Use                                                                                     | Tradeoff                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native `Telegram.Login.auth()` via loaded widget script (recommended)                                                               | `@telegram-auth/react` or `react-telegram-login` npm packages                                 | These wrap the **classic hash-based** widget (`data-onauth`, HMAC-SHA256 validation) — not the new OIDC/`id_token` flow this backend contract expects. Confirmed via WebSearch: `react-telegram-login`'s README documents the old `id/first_name/.../hash` callback shape, not `id_token`. Introducing either package would be actively wrong for this contract, not just unnecessary — do not add them.                     |
| Custom-styled `btn btn-outline btn-primary` button that calls `Telegram.Login.auth()` programmatically on click (locked by UI-SPEC) | Telegram's auto-rendered `<script data-telegram-login="bot" data-onauth="...">` iframe widget | The auto-rendered widget renders Telegram's **own** branded button inside an iframe — cannot be restyled to match DaisyUI. UI-SPEC has already locked a fully custom button, which is only achievable by calling `Telegram.Login.auth(options, callback)` directly from an app-owned `onClick`, not by embedding the auto-widget snippet.                                                                                    |
| Client-side TTL self-check on `registrationToken` (recommended, discretionary)                                                      | Rely purely on the backend's rejection of an expired/reused token                             | A client-side timestamp check (store `issuedAt` alongside the token, compare against `Date.now()` on `/telegram-register` mount) can show the TG-03 restart state **instantly**, without a doomed round trip to `/auth/telegram/register`, if the user leaves the tab open past 10 minutes. Not required (backend enforcement is authoritative either way) but cheap and improves perceived correctness — see Code Examples. |

**Installation:** None required — no new packages.

## Package Legitimacy Audit

Not applicable — this phase installs no new npm packages. The Telegram OIDC integration is a third-party `<script>` tag (`https://telegram.org/js/telegram-widget.js`), loaded via `next/script`, not an npm dependency. All form/validation work reuses already-installed `react-hook-form`/`zod`/`@hookform/resolvers`.

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Browser tab — /login (login-page.tsx)                                        │
│                                                                                  │
│  [Войти через Telegram] click                                                  │
│         │                                                                       │
│         ▼  state: nonce-loading                                                │
│  telegramNonce()  ── POST /auth/telegram/nonce  ── new API fn, auth-api.ts     │
│         │  (fast — minimize this gap, see Pitfall 1)                           │
│         ▼  state: awaiting-popup                                               │
│  window.Telegram.Login.auth({ client_id, nonce, scope: ['profile'] }, cb)     │
│    — script preloaded on mount via <Script src="telegram-widget.js" .../>     │
│      so only the nonce round-trip stands between click and popup open         │
│         │                                                                       │
│         │   Telegram popup (oauth.telegram.org) — user approves in Telegram   │
│         │   ⚠ COOP:same-origin on THIS page would break window.opener link    │
│         │   ⚠ popup can be blocked if click→auth() gap was too long           │
│         ▼  cb({ id_token, user, error })                                      │
│  state: exchanging                                                             │
│         │                                                                       │
│         ▼                                                                       │
│  telegramLogin({ idToken })  ── POST /auth/telegram/login  ── new API fn       │
│         │                                                                       │
│    ┌────┴─────────────────────────────┐                                        │
│    ▼ success (TAuthResponse)          ▼ registrationRequired: true             │
│  setTokens/setUser                  sessionStorage.setItem(                    │
│  resetSessionExpiredNotified()        TELEGRAM_REG_TOKEN_KEY, registrationToken)│
│  router.push(getSafeRedirect(...))  sessionStorage.setItem(                    │
│  [TG-01 done]                         TELEGRAM_REG_PROFILE_KEY, JSON(profile)) │
│                                      sessionStorage.setItem(                    │
│                                        TELEGRAM_REG_ISSUED_AT_KEY, Date.now()) │
│                                      router.push('/telegram-register')         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  /telegram-register (telegram-register-page.tsx) — NEW route                  │
│                                                                                  │
│  on mount: read sessionStorage (token/profile/issuedAt)                       │
│    ├── missing token, OR now - issuedAt > 10min  → render TG-03 restart state │
│    │     (never render the form — same "replace, don't overlay" rule)         │
│    └── present + fresh → render completion form, prefilled from `profile`     │
│                                                                                  │
│  submit → telegramRegister({ registrationToken, first_name, last_name,        │
│             email, phone, policyVersion, pdAgreementVersion })                │
│    ├── success (TAuthResponse)                                                │
│    │     → clear all TELEGRAM_REG_* sessionStorage keys                       │
│    │     → setTokens/setUser, resetSessionExpiredNotified()                   │
│    │     → router.push(getSafeRedirect(...))                                  │
│    ├── email-conflict signal (see Pitfall 6 — exact shape ASSUMED)            │
│    │     → clear TELEGRAM_REG_* keys                                          │
│    │     → sessionStorage.setItem('login-form-draft', JSON{email})           │
│    │        (reuses existing mechanism login-page.tsx already reads)          │
│    │     → sessionStorage.setItem(TELEGRAM_LINK_HINT_FLAG_KEY, '1')           │
│    │     → render TG-04 state, CTA → router.push('/login')                   │
│    └── any other error (network, 4xx/5xx, ambiguous)                          │
│          → clear TELEGRAM_REG_* keys                                          │
│          → render TG-03 state, CTA "Войти через Telegram заново" → /login    │
│                                                                                  │
│  footer "Это не вы?" link → clears TELEGRAM_REG_* keys → /login (no API call) │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│  /profile (profile-page.tsx) — existing rows unchanged, + new disabled row    │
│    rendered ONLY if TELEGRAM_LINK_HINT_FLAG_KEY was set (one-shot, cleared    │
│    on first read, same pattern as RegistrationNoticeListener/REG-03)          │
│    "Привязать Telegram" — disabled, tooltip → real wiring is Phase 4 LINK-01  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/features/auth/api/
└── auth-api.ts                       # EDIT: add telegramNonce, telegramLogin, telegramRegister

src/features/auth/lib/
├── auth-schemas.ts                   # EDIT: add telegramRegisterSchema (no password field)
├── telegram-registration.ts          # NEW — sessionStorage key constants + get/set/clear helpers
│                                      #   (mirrors registration-notice.ts's "single source of
│                                      #   truth for the key string" shape, WR-03 precedent)
└── use-telegram-oidc.ts              # NEW — the reusable "click → nonce → popup → id_token"
                                       #   hook/utility; Phase 4's LINK-01 will import this
                                       #   unchanged and only supply a different backend call

src/features/auth/ui/
└── telegram-link-hint-listener/      # NEW (or extend registration-notice-listener's pattern)
    ├── telegram-link-hint-listener.tsx   # reads TELEGRAM_LINK_HINT_FLAG_KEY, exposes a
    │                                      #  boolean/hook profile-page.tsx consumes to
    │                                      #  conditionally render the disabled hint row
    ├── telegram-link-hint-listener.test.tsx
    └── index.ts

src/views/auth/ui/
├── login-page.tsx                    # EDIT: wire the 5-state Telegram button, preload
│                                      #   the widget script via next/script on mount
├── login-page.test.tsx               # EDIT: add Telegram button state-machine tests
├── telegram-register-page.tsx        # NEW — TG-02/TG-03/TG-04 page (form + 2 replacement states)
└── telegram-register-page.test.tsx   # NEW

src/views/auth/index.ts               # EDIT: export TelegramRegisterPage

src/app/(web)/telegram-register/
└── page.tsx                          # NEW — thin wrapper, same shape as every other auth route

src/proxy.ts                          # EDIT (recommended, see Pitfall 4): add '/telegram-register'
                                       #   to AUTH_ONLY so an already-logged-in user is redirected away

src/views/profile/ui/
├── profile-page.tsx                  # EDIT: conditionally render disabled "Привязать Telegram" row
└── profile-page.test.tsx             # EDIT: add test for the conditional row
```

### Pattern 1: Reusable low-level OIDC utility, decoupled from the login/register/link decision

**What:** A hook/function that owns exactly: preload the widget script once, expose a `getIdToken(): Promise<{ idToken: string } | { error: 'popup-blocked' | 'cancelled' | 'unknown' }>` that internally does `telegramNonce()` then `window.Telegram.Login.auth(...)`. It does **not** know or care whether the caller is going to POST to `/login`, `/register`, or (Phase 4) `/link`.

**When to use:** Any surface that needs "get me a fresh Telegram `id_token`" — TG-01's login button and TG-02's (implicit, already-completed-by-then) flow both need it; Phase 4's LINK-01 needs the identical mechanic.

```typescript
// Source: new file, src/features/auth/lib/use-telegram-oidc.ts — pattern only, not existing code
'use client';
import { useCallback, useRef, useState } from 'react';
import { telegramNonce } from '../api/auth-api';

type TTelegramOidcState = 'idle' | 'nonce-loading' | 'awaiting-popup' | 'exchanging' | 'error';
type TTelegramOidcResult = { idToken: string } | { error: string };

declare global {
    interface Window {
        Telegram?: {
            Login?: {
                auth(
                    options: { client_id: number; nonce?: string; scope?: string[]; lang?: string },
                    callback: (data: { id_token?: string; user?: unknown; error?: string }) => void,
                ): void;
            };
        };
    }
}

export function useTelegramOidc(clientId: number) {
    const [state, setState] = useState<TTelegramOidcState>('idle');

    const getIdToken = useCallback(async (): Promise<TTelegramOidcResult> => {
        setState('nonce-loading');
        let nonce: string;
        try {
            ({ nonce } = await telegramNonce());
        } catch {
            setState('error');
            return { error: 'nonce-failed' };
        }

        if (!window.Telegram?.Login) {
            setState('error');
            return { error: 'widget-not-loaded' };
        }

        setState('awaiting-popup');
        return new Promise((resolve) => {
            window.Telegram!.Login!.auth(
                { client_id: clientId, nonce, scope: ['profile'] },
                (data) => {
                    if (data.error || !data.id_token) {
                        setState('error');
                        // Telegram's own error strings are not localized/user-facing —
                        // map to the locked "popup-blocked" vs "generic" copy in the
                        // calling component, don't render data.error directly (UI-SPEC
                        // does not include a raw-passthrough error state).
                        resolve({ error: data.error ?? 'no-id-token' });
                        return;
                    }
                    setState('exchanging');
                    resolve({ idToken: data.id_token });
                },
            );
        });
    }, [clientId]);

    return { state, getIdToken };
}
```

### Pattern 2: `registrationToken` sessionStorage lifecycle (TG-03)

**What:** Single-source-of-truth key constants (mirroring `REGISTRATION_NOTICE_FLAG_KEY`'s WR-03 precedent — avoid a string-literal mismatch between writer and reader), a `try/catch`-wrapped get/set/clear API (mirroring `use-form-draft.ts`'s guarded `sessionStorage` access — storage can synchronously throw in sandboxed iframes/certain privacy modes), and an explicit client-side freshness check.

```typescript
// Source: new file, src/features/auth/lib/telegram-registration.ts — pattern only
export const TELEGRAM_REG_TOKEN_KEY = 'telegram-registration-token';
export const TELEGRAM_REG_PROFILE_KEY = 'telegram-registration-profile';
export const TELEGRAM_REG_ISSUED_AT_KEY = 'telegram-registration-issued-at';
const TTL_MS = 10 * 60 * 1000; // 10 minutes — mirrors backend TTL (TG-03), client-side is UX-only

export type TTelegramProfile = { first_name: string; last_name?: string; photo_url?: string };

export function setTelegramRegistration(token: string, profile: TTelegramProfile): void {
    try {
        sessionStorage.setItem(TELEGRAM_REG_TOKEN_KEY, token);
        sessionStorage.setItem(TELEGRAM_REG_PROFILE_KEY, JSON.stringify(profile));
        sessionStorage.setItem(TELEGRAM_REG_ISSUED_AT_KEY, String(Date.now()));
    } catch {
        // Storage unavailable — telegram-register-page.tsx's read will also fail
        // closed (no token found) and correctly show the TG-03 restart state.
    }
}

export function readTelegramRegistration(): { token: string; profile: TTelegramProfile } | null {
    try {
        const token = sessionStorage.getItem(TELEGRAM_REG_TOKEN_KEY);
        const profileJson = sessionStorage.getItem(TELEGRAM_REG_PROFILE_KEY);
        const issuedAt = Number(sessionStorage.getItem(TELEGRAM_REG_ISSUED_AT_KEY));
        if (!token || !profileJson || !issuedAt) return null;
        if (Date.now() - issuedAt > TTL_MS) return null; // client-side freshness check
        return { token, profile: JSON.parse(profileJson) as TTelegramProfile };
    } catch {
        return null;
    }
}

export function clearTelegramRegistration(): void {
    try {
        sessionStorage.removeItem(TELEGRAM_REG_TOKEN_KEY);
        sessionStorage.removeItem(TELEGRAM_REG_PROFILE_KEY);
        sessionStorage.removeItem(TELEGRAM_REG_ISSUED_AT_KEY);
    } catch {
        // ignore
    }
}
```

### Pattern 3: Error-branching decision table on `POST /auth/telegram/register` (TG-03 vs TG-04)

**What:** Exactly two outcomes on failure — "email taken" (TG-04, specific redirect) and "everything else" (TG-03, restart). Do not add a third bucket; UI-SPEC only designed for these two.

| Signal                                                                         | Outcome                                                                                   |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `2xx` response                                                                 | Success — tokens stored, redirect (TG-01/TG-02 happy path)                                |
| Distinguishable "email taken" signal (exact shape `[ASSUMED]` — see Pitfall 6) | TG-04 — clear token, prefill `login-form-draft`, set link-hint flag, redirect to `/login` |
| Any other `4xx`/`5xx`, network failure, timeout, malformed response            | TG-03 — clear token, show restart state, no redirect (user must click the CTA)            |

### Anti-Patterns to Avoid

- **Reusing `TelegramAdapter` or `mockTelegramEnv` for anything in this phase.** Different Telegram surface entirely (Mini App SDK vs. web OIDC widget) — zero code-reuse potential beyond the shared brand icon.
- **Installing `react-telegram-login`/`@telegram-auth/react` or similar npm wrappers.** They implement the classic hash-based widget, not the `id_token` OIDC flow this backend expects — see Alternatives Considered.
- **Embedding Telegram's auto-rendered `<script data-telegram-login>` widget markup.** Renders Telegram's own iframe button, cannot be restyled to the locked DaisyUI button — must call `Telegram.Login.auth()` programmatically instead.
- **Adding a `headers()` config with `Cross-Origin-Opener-Policy: same-origin` anywhere that could apply to `/login`/`/telegram-register`.** Breaks the popup's `window.opener` link per Telegram's own documentation — flag this explicitly to any future security-headers-hardening phase.
- **Passing `registrationToken` as a URL query parameter to `/telegram-register`.** PROJECT.md's Constraints section is explicit: sessionStorage only, never `localStorage`, and by extension never a URL (query params land in browser history, referrer headers, and server access logs — the same class of leak the codebase already treats `localStorage` as unsafe for).
- **Rendering the TG-03/TG-04 states alongside the completion form ("hide the fields, show a banner above them").** UI-SPEC is explicit these states **replace** the card contents entirely.

## Don't Hand-Roll

| Problem                                                                   | Don't Build                                                            | Use Instead                                                                                                                | Why                                                                                                                                                                |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Third-party script loading (widget)                                       | A manual `document.createElement('script')` + `onload` promise wrapper | `next/script` (`<Script src="..." strategy="afterInteractive" onLoad={...} />`)                                            | Framework-native, SSR-safe, de-dupes automatically if mounted more than once; no existing hand-rolled script-injector exists in this codebase to imitate instead   |
| One-shot cross-navigation UI signal (TG-04's "arrived via conflict" hint) | A new event bus / toast system                                         | Clone `RegistrationNoticeListener`'s exact shape (`useIsClient` + `sessionStorage` flag + dismiss-clears-flag)             | Already solved twice in this codebase (`SessionExpiredListener` event-based, `RegistrationNoticeListener` flag-based) — compose, don't invent a third variant      |
| Redirect-target sanitization                                              | A new redirect validator                                               | `getSafeRedirect()` [VERIFIED: src/shared/lib/get-safe-redirect.ts]                                                        | Already validates path shape, rejects `//`/`javascript:` — reuse unchanged for TG-01/TG-02 success redirects                                                       |
| Login-form email prefill on TG-04 redirect                                | A new sessionStorage key/mechanism for "pending login email"           | `login-form-draft` key via `useFormDraft`/`getFormDraft<TLoginForm>` — UI-SPEC explicitly locks this, "no new storage key" | `login-page.tsx` already reads this exact key on mount for its own draft-restore feature; writing `{ email }` into it before redirect is a **zero-new-code** reuse |
| Avatar fallback rendering (TG-02 completion form)                         | A new avatar component                                                 | Clone `curator-master-card.tsx`'s `avatar`/`avatar-placeholder` + `formatUserInitials` pattern, scaled to `size-20`        | UI-SPEC explicitly locks this as the precedent to follow                                                                                                           |
| Consent checkboxes (TG-02)                                                | A new consent-checkbox component from scratch                          | Extract or verbatim-duplicate `register-page.tsx`'s `ConsentCheckboxes`                                                    | UI-SPEC requires pixel-identical markup/copy; planner picks extraction vs duplication, but must not redesign                                                       |

**Key insight:** Unlike Phase 2 (where the risk was duplicate-building something that already existed), this phase's risk profile is the opposite — most of the OIDC integration genuinely has no precedent in this codebase, so the temptation is either (a) under-designing it as "just another form" and missing the popup-timing/script-loading subtleties, or (b) over-engineering a generic multi-provider OAuth abstraction the project doesn't need (there is exactly one non-email login method, Telegram — don't build a `PlatformAdapter`-style plugin system for a single provider).

## Runtime State Inventory

Not applicable — this is not a rename/refactor/migration phase. No trigger condition met.

## Common Pitfalls

### Pitfall 1: The nonce-fetch-then-popup gap can silently defeat the browser's popup-blocker exemption

**What goes wrong:** The button click is a valid user gesture, but `Telegram.Login.auth()` (which calls `window.open()` internally) is only invoked _after_ an `await fetch(/auth/telegram/nonce)` resolves. Some browsers (Safari in particular) only preserve "transient user activation" for a very short window and do not reliably carry it across a `Promise`/microtask boundary, let alone a network round trip — even a fast one. The result: intermittent, hard-to-reproduce popup blocking that has nothing to do with backend latency and everything to do with browser activation-tracking internals.

**Why it happens:** Any OAuth-style "click → async setup → open popup" pattern has this problem; it is not specific to Telegram, but it is easy to discover only in manual QA on Safari/iOS rather than in an automated test (happy-dom does not model popup-blocker heuristics).

**How to avoid:** (1) Preload the widget script eagerly on `/login` mount (`next/script strategy="afterInteractive"`, or on component mount) so `window.Telegram.Login` is already defined by the time of any click — the _only_ async work between click and `auth()` is the nonce fetch itself, nothing else. (2) Keep the nonce endpoint fast and do not chain any other awaited work before calling `auth()`. (3) Accept that popup-blocked will still occur sometimes — this is exactly why UI-SPEC has a dedicated, non-fatal "Разрешите всплывающие окна…" error state that returns the button to idle, not a bug to chase further.

**Warning signs:** Manual Playwright MCP test should include at least one deliberate popup-block scenario (Playwright can simulate this) to confirm the button returns to idle with the correct message rather than getting stuck in `awaiting-popup`.

### Pitfall 2: `Cross-Origin-Opener-Policy: same-origin` silently breaks the whole flow if ever introduced

**What goes wrong:** If any future change (security-headers hardening, a CDN/proxy default, a Next.js `headers()` config) sets `COOP: same-origin` on `/login` or `/telegram-register`, the popup's ability to communicate back to the opener window breaks, and the Telegram login flow fails with no useful error surfaced to this app's code (the callback may simply never fire).

**Why it happens:** COOP `same-origin` is a common, reasonable-looking security hardening default that has nothing to do with Telegram specifically — a well-intentioned future change could add it without knowing about this dependency.

**How to avoid:** Confirmed via direct read that `next.config.ts` sets no `headers()` today — no current conflict. Document this constraint prominently (e.g., a comment near the Telegram button/script-loading code) so a future security phase doesn't introduce it blind.

**Warning signs:** Telegram login "just stops working" with the popup opening and closing but the callback never firing, no browser console error.

### Pitfall 3: `Telegram.Login` may not be a stable, versioned URL — verify at execution time, not from training data

**What goes wrong:** The exact script URL/version query parameter (`telegram-widget.js?NN`) is the kind of detail Telegram can bump without much fanfare. Shipping a stale or wrong version could silently fail to expose `Telegram.Login.auth` (as opposed to only the legacy `data-onauth` iframe API).

**Why it happens:** This session's WebFetch of `core.telegram.org/bots/telegram-login` and `core.telegram.org/widgets/login` confirmed the `Telegram.Login.auth(InitOptions, callback)` API surface and its `id_token`/`nonce` contract, but did **not** surface the literal current `<script src>` value.

**How to avoid:** At execution time, pull the exact script tag from BotFather's Web Login setup screen or the live "customize your button" tool on `core.telegram.org/widgets/login` — do not hard-code a version number from training data without confirming it against the live page first.

**Warning signs:** `window.Telegram.Login` is `undefined` after the script's `onLoad` fires.

### Pitfall 4: `proxy.ts`'s `AUTH_ONLY` array does not currently include `/telegram-register` — an already-logged-in user could land on it

**What goes wrong:** `proxy.ts` redirects an authenticated user (has `access_token` cookie) away from `/login`/`/register`/`/forgot-password`/`/reset-password`, but `/telegram-register` is a brand-new route this phase introduces and is not in that list. An already-logged-in user who somehow navigates there directly (bookmark, back button, shared link) would see the completion form with no valid `registrationToken` in their sessionStorage — which the page-level client check (Pattern 2) correctly catches by showing the TG-03 restart state, so this is not a hard bug, but it's an inconsistent experience (a logged-in user gets a "session expired" message for a flow they were never in).

**Why it happens:** UI-SPEC does not mention `proxy.ts` at all — it is exclusively a visual/copy contract, not a routing-guard contract, so this gap would be easy to miss if the planner treats UI-SPEC as the complete scope.

**How to avoid:** Add `/telegram-register` to `proxy.ts`'s `AUTH_ONLY` array alongside the other auth routes, so an authenticated user is redirected to `/` (or `from`) before ever seeing the page. This is a one-line, low-risk addition (Claude's Discretion per UI-SPEC's silence on routing).

**Warning signs:** Manual test: log in, then navigate directly to `/telegram-register` — currently would render the TG-03 state instead of redirecting away.

### Pitfall 5: sessionStorage access can synchronously throw — every read/write in the new code needs the same try/catch discipline already established

**What goes wrong:** `use-form-draft.ts` and `registration-notice-listener.tsx` both wrap `sessionStorage` access in `try/catch` with an explicit comment explaining why (sandboxed iframes, certain Safari private-mode configurations can throw synchronously on `.getItem`/`.setItem`). New code in `telegram-registration.ts` that skips this would be inconsistent with the rest of the codebase and could crash the registration-completion page's render (no error boundary is mounted around individual `(web)` pages per the existing `RegistrationNoticeListener` comment).

**Why it happens:** Easy to forget when writing fresh code that isn't directly copy-pasted from an existing try/catch-guarded file.

**How to avoid:** Follow Pattern 2's code example verbatim — every sessionStorage touch point wrapped, fail-closed (treat inaccessible storage as "no token found" → TG-03 state, which is the correct, safe default).

**Warning signs:** A test asserting `telegram-register-page.tsx` still renders _something_ sensible (not a crash) when `sessionStorage` is stubbed to throw.

### Pitfall 6: The exact signal for "email already taken" on `POST /auth/telegram/register` is not verified against backend source this session — do not hard-code a guess without a fallback-safe default

**What goes wrong:** REQUIREMENTS.md/ROADMAP.md describe the _behavior_ ("если email уже занят") but not the wire-level signal (a specific HTTP status like `409`, a JSON field like `{ emailTaken: true }`, or a specific error-message string to pattern-match). `docs/features/auth/ACCOUNT_LINKING.md` (superseded document, magic-link plan cancelled, but its _technical convention_ may still hold) documents `webRegister`'s analogous "email conflict" case as `409 { needsVerification: true }` — a plausible but unverified precedent for how this backend team signals conflict states in general.

**Why it happens:** Backend repo (`crm-aqua-kinetics-back`) is not present on this development machine this session (same limitation Phase 2's research flagged for `/auth/web/login`'s 401 body).

**How to avoid:** Implement the branch defensively: treat `err.status === 409` as the primary "email taken" signal (matching the documented `webRegister` precedent), but **do not treat any other status as "email taken" by default** — per Pattern 3's decision table, anything not positively identified as the conflict case must fall through to the TG-03 restart branch, never silently succeed or silently show a wrong message. Flag to the user/backend-agent for confirmation before this task is marked done — this is the single highest-risk unverified assumption in this phase (see Assumptions Log A2).

**Warning signs:** A regression test that mocks a `409` response and asserts the TG-04 state renders, and a second test that mocks an unrelated `400`/`500`/network-error and asserts the TG-03 state renders instead (never TG-04) — both must exist, not just the happy path.

## Code Examples

### `next/script` widget preload (login-page.tsx)

```tsx
// Source: pattern derived from next/script docs — no existing script-loading
// precedent in this codebase to clone from (first use of next/script here)
import Script from 'next/script';

// Inside LoginForm or a wrapping component:
<Script src="https://telegram.org/js/telegram-widget.js?22" strategy="afterInteractive" />;
// NOTE: confirm the exact `?22` version suffix against the live BotFather/
// core.telegram.org/widgets/login snippet at execution time (Pitfall 3) —
// do not ship this literal value from research without re-checking it.
```

### New API functions (`auth-api.ts`)

```typescript
// Recommended additions to src/features/auth/api/auth-api.ts, same style as
// existing webLogin/webRegister — exact request/response field names are
// [ASSUMED] pending backend confirmation, see Assumptions Log A1.
export type TTelegramNonceResponse = { nonce: string };

export async function telegramNonce(): Promise<TTelegramNonceResponse> {
    return apiClient<TTelegramNonceResponse>('/auth/telegram/nonce', { method: 'POST' });
}

export type TTelegramLoginResponse =
    | TAuthResponse
    | {
          registrationRequired: true;
          registrationToken: string;
          profile: { first_name: string; last_name?: string; photo_url?: string };
      };

export async function telegramLogin(idToken: string): Promise<TTelegramLoginResponse> {
    return apiClient<TTelegramLoginResponse>('/auth/telegram/login', {
        method: 'POST',
        body: { idToken },
    });
}

export async function telegramRegister(body: {
    registrationToken: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    policyVersion: string;
    pdAgreementVersion: string;
}): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/telegram/register', { method: 'POST', body });
}
```

### `telegramRegisterSchema` (`auth-schemas.ts`)

```typescript
// Recommended addition — same phoneE164Ru regex as register-page.tsx's local
// registerSchema; consider hoisting that regex to a shared constant while touching
// this file, since it will now be duplicated across two schemas.
export const telegramRegisterSchema = z.object({
    first_name: z.string().trim().min(1, 'Имя обязательно'),
    last_name: z.string().trim().min(1, 'Фамилия обязательна'),
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    phone: z.string().regex(/^\+7\d{10}$/, 'Введите номер в формате +7 999 999-99-99'),
    agreePolicy: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие с политикой конфиденциальности',
    }),
    agreePd: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие на обработку персональных данных',
    }),
});
export type TTelegramRegisterForm = z.infer<typeof telegramRegisterSchema>;
```

## State of the Art

| Old Approach                                                            | Current Approach                                                                                                                                                                                                                                                                                                                           | When Changed                           | Impact                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N/A — no prior Telegram web-login research exists in this GSD milestone | This is the first phase to integrate any part of Telegram's web OIDC login; Telegram itself migrated from the classic hash-based widget (`data-onauth`, HMAC-SHA256) to a full OIDC flow with `id_token`/PKCE support in its "new" login mode (2024-2025 rollout per the Medium walkthrough and BotFather's "OpenID Connect Login" toggle) | Telegram-side change, not project-side | Any tutorial, npm package (`react-telegram-login`, `@telegram-auth/react`), or training-data memory describing the classic `data-onauth`/hash flow is describing the **wrong** mechanism for this backend's `id_token` contract — verify any external reference is describing the OIDC flow, not the legacy widget, before trusting it |

**Deprecated/outdated:** The classic Telegram Login Widget (`data-onauth`, hash validation) is not deprecated by Telegram globally, but it is **not what this backend contract uses** — do not follow tutorials/packages built against it.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                                                                | Section                                            | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `POST /auth/telegram/login`'s request body is `{ idToken: string }` and its `registrationRequired: true` response includes a `profile` object shaped `{ first_name, last_name?, photo_url? }` alongside `registrationToken` — not verified against backend source this session (repo unavailable)    | Architecture Patterns, Code Examples               | If the actual field names differ (e.g., `id_token` vs `idToken`, or `telegramProfile` vs `profile`), the planner's task breakdown is still correct in shape but the exact API function bodies need a one-line adjustment once the real contract is confirmed — low risk, easy fix, but must be confirmed with the backend-agent/user before or during Wave 0 rather than assumed silently                                                                                                                                                                                                                                                                                                      |
| A2  | The backend signals "email already taken" on `POST /auth/telegram/register` via HTTP `409`, following the same convention `ACCOUNT_LINKING.md` documents for `webRegister`'s analogous conflict case — not verified against backend source this session                                              | Common Pitfalls 6, Architecture Patterns Pattern 3 | If the actual signal is a different status code or a message-based distinction, the TG-03/TG-04 branch in Pattern 3 would misclassify a real email-conflict as a generic restart (safe-ish failure — user just has to retry Telegram login, doesn't create a duplicate account since the whole POST failed) or, worse, misclassify a generic error as email-conflict (would incorrectly send an ordinary network-error user to the email-login page). **This is the single highest-priority item to confirm with the backend-agent before or during this phase's Wave 0** — recommend a `checkpoint:human-verify` or explicit backend-contract confirmation task before wiring TG-04's branch. |
| A3  | The Telegram widget script's current version-suffixed URL (e.g. `telegram-widget.js?22`) is accurate/current — sourced from general knowledge of the widget's versioning scheme, not confirmed live this session                                                                                     | Code Examples, Common Pitfalls 3                   | If stale, `window.Telegram.Login` may be undefined or behave unexpectedly after script load — must be re-verified against BotFather's live snippet or `core.telegram.org/widgets/login`'s customizer at execution time, not shipped from this document verbatim                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A4  | A Telegram bot already exists for this project with "Web Login"/OIDC mode enabled in BotFather, and its `client_id`/allowed-domain whitelist are already configured — not verified this session (no `NEXT_PUBLIC_TELEGRAM_*` env var found in `.env.example`, suggesting this may NOT yet be set up) | Environment Availability                           | If no such bot/config exists yet, this phase is **blocked on a manual BotFather setup step** (not a coding task) before any end-to-end testing (including Playwright MCP manual verification) is possible — code can still be written and unit-tested against mocks regardless, but live verification cannot happen until this exists. Flag to the user immediately, do not discover this mid-execution.                                                                                                                                                                                                                                                                                       |

**If this table is empty:** N/A — see rows above.

## Open Questions (RESOLVED)

1. **Exact `POST /auth/telegram/login`/`register` request/response field names (A1)**
    - What we know: The overall shape (nonce → id_token → login/register, `registrationRequired` branch, `registrationToken`) is fixed by REQUIREMENTS.md/ROADMAP.md.
    - What's unclear: Precise JSON field casing/naming (`idToken` vs `id_token`, `profile` vs `telegramProfile`, etc.) — backend repo unavailable this session.
    - RESOLVED: Confirm empirically during Wave 0 / first implementation task — the executor hits the deployed backend directly (or coordinates with the backend-agent per CLAUDE.md's co-agent protocol) and adjusts `auth-api.ts`'s function bodies to match. Contained, low-risk fix if the initial guess is wrong; does not block planning.

2. **Exact "email taken" signal on registration (A2)**
    - What we know: `ACCOUNT_LINKING.md` documents a `409` convention for the analogous `webRegister` case.
    - What's unclear: Whether `POST /auth/telegram/register` follows the identical convention. Asked the user directly — they did not have this backend detail on hand.
    - RESOLVED: Same as A1 — confirm empirically at execution time (direct request against the deployed backend, or via backend-agent coordination) before implementing the TG-03/TG-04 branch. The planner should isolate this into its own task so the empirical check happens before the conflict-handling logic is written, not after.

3. **BotFather bot configuration status (A4)**
    - What we know: No `NEXT_PUBLIC_TELEGRAM_*` env var exists in `.env.example` today.
    - What's unclear: Whether a bot with "Web Login"/OIDC mode has already been set up.
    - RESOLVED: User confirmed **not configured yet**. This blocks _live browser verification_ only, not code authorship — the plan proceeds with implementation + unit/regression tests as normal, but any UAT/manual-verification item requiring a real Telegram Login popup must be flagged as blocked-by-environment (`blocked_by: third-party`) until the bot is set up via BotFather (client_id, redirect domain, "Web Login" mode). Do not treat this as a phase-level blocker — same pattern as SESSION-04 in Phase 1, where code was verified and only the final live-browser check waited.

## Environment Availability

| Dependency                                                                                                     | Required By                          | Available                                                                                                                                 | Version                                               | Fallback                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram bot with "Web Login"/OIDC mode enabled (BotFather), `client_id` + allowed-domain whitelist configured | TG-01/TG-02 end-to-end functionality | ✗ (no `NEXT_PUBLIC_TELEGRAM_*` env var found in `.env.example`)                                                                           | —                                                     | None — this is a manual BotFather configuration step, not something the frontend can substitute. Code can be written/unit-tested against mocks regardless; live/Playwright MCP verification is blocked until this exists. |
| `telegram.org/js/telegram-widget.js` (external, Telegram-hosted script)                                        | TG-01/TG-02 popup flow               | Not applicable to probe locally (external CDN, always "available" assuming network access)                                                | Version suffix `[ASSUMED]`, verify live per Pitfall 3 | N/A                                                                                                                                                                                                                       |
| Backend `/auth/telegram/nonce`, `/auth/telegram/login`, `/auth/telegram/register` endpoints                    | All of TG-01..04                     | Per PROJECT.md: "уже задеплоены" — not re-probed this session, treated as available per the same project decision log Phase 1/2 relied on | —                                                     | —                                                                                                                                                                                                                         |

**Missing dependencies with no fallback:**

- Telegram bot Web-Login/OIDC configuration (`client_id`, allowed domains) — must be confirmed/created before any live testing of this phase's code. Surface this to the user at the start of planning.

**Missing dependencies with fallback:**

- None — the one missing piece (bot config) has no frontend-side workaround.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 3.2.4 [VERIFIED: package.json, consistent with Phase 1/2's research]                                                                                            |
| Config file        | `vitest.config.ts` (`environment: 'happy-dom'`, `globals: true`)                                                                                                       |
| Quick run command  | `npm run test -- src/views/auth/ui/login-page.test.tsx src/views/auth/ui/telegram-register-page.test.tsx src/features/auth src/views/profile/ui/profile-page.test.tsx` |
| Full suite command | `npm run test`                                                                                                                                                         |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                                                                                                           | Test Type                                | Automated Command                                                                           | File Exists?                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| TG-01  | Click → nonce fetched → `Telegram.Login.auth` called with nonce → success branch stores tokens + redirects                                                         | unit (mock `window.Telegram.Login.auth`) | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                     | ❌ Wave 0 — new state-machine tests needed |
| TG-01  | Popup-blocked / generic error → button returns to idle with correct `alert-error` copy, email form remains usable                                                  | unit                                     | `npm run test -- src/views/auth/ui/login-page.test.tsx`                                     | ❌ Wave 0                                  |
| TG-02  | `registrationRequired: true` branch → sessionStorage populated, redirect to `/telegram-register`, form prefilled from `profile`                                    | unit                                     | `npm run test -- src/views/auth/ui/login-page.test.tsx` + `telegram-register-page.test.tsx` | ❌ Wave 0                                  |
| TG-02  | Completion form submit → `telegramRegister` called with correct payload (no password field present anywhere) → success stores tokens + redirects                   | unit                                     | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx`                         | ❌ Wave 0 — new file                       |
| TG-03  | Missing/expired sessionStorage token on `/telegram-register` mount → restart state rendered, form never shown                                                      | unit                                     | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx`                         | ❌ Wave 0                                  |
| TG-03  | Ambiguous error on submit (network failure, unrelated 4xx/5xx) → restart state rendered, sessionStorage cleared                                                    | unit                                     | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx`                         | ❌ Wave 0                                  |
| TG-04  | Email-conflict signal on submit → form replaced with conflict state, `login-form-draft` prefilled with the email, link-hint flag set, sessionStorage token cleared | unit                                     | `npm run test -- src/views/auth/ui/telegram-register-page.test.tsx`                         | ❌ Wave 0                                  |
| TG-04  | `profile-page.tsx` renders the disabled "Привязать Telegram" row only when the link-hint flag is present, and only once (flag cleared after first read)            | unit                                     | `npm run test -- src/views/profile/ui/profile-page.test.tsx`                                | ❌ Wave 0                                  |

### Sampling Rate

- **Per task commit:** `npm run test -- <changed test files>`
- **Per wave merge:** `npm run test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`; additionally, given the BotFather-configuration dependency (Environment Availability), a **manual Playwright MCP end-to-end pass is required and cannot be automated away** — unit tests can mock `window.Telegram.Login.auth` exhaustively, but nothing in this test suite can substitute for a real popup round trip against `oauth.telegram.org`, so the phase gate should explicitly include at least one live manual click-through once the bot is configured.

### Wave 0 Gaps

- [ ] `src/views/auth/ui/login-page.test.tsx` — add: full Telegram button state-machine coverage (idle → nonce-loading → awaiting-popup → exchanging → success/error), mocking `window.Telegram = { Login: { auth: vi.fn(...) } }` (new mock shape — the existing `@tma.js/sdk-react` mock in `telegram-adapter.test.ts` is unrelated and not reusable, see Summary)
- [ ] `src/views/auth/ui/telegram-register-page.test.tsx` — new file, does not exist; must cover: prefill-from-sessionStorage, missing/expired-token → restart state, submit success, submit → TG-03 branch, submit → TG-04 branch
- [ ] `src/features/auth/lib/telegram-registration.test.ts` — new file; cover set/read/clear + TTL expiry + storage-throws-synchronously fail-closed behavior (mirrors `use-form-draft.test.ts`'s existing storage-guard test style)
- [ ] `src/views/profile/ui/profile-page.test.tsx` — extend existing file (confirmed exists per Phase 2 work) with a test for the conditional "Привязать Telegram" row
- [ ] A manual/Playwright MCP smoke pass for the actual popup round trip — **cannot be automated**, and is blocked until the BotFather bot configuration (Environment Availability) exists

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies           | Standard Control                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | Yes               | `id_token` cryptographic verification (signature, `iss`/`aud`/`exp`, nonce cross-check) is entirely backend responsibility — the frontend must treat the `id_token` as an opaque bearer value and never attempt to decode/trust its claims client-side for any authorization decision (only Telegram's own `Telegram.Login.auth` callback's `user` object may be used for prefill display purposes, which is not a security-relevant use) |
| V3 Session Management | No (new work)     | Fully covered by Phase 1 — this phase reuses `setTokens`/`setUser`/`useAuthStore` unchanged for both TG-01 and TG-02's success paths                                                                                                                                                                                                                                                                                                      |
| V4 Access Control     | Yes               | New route `/telegram-register` should be added to `proxy.ts`'s `AUTH_ONLY` list (Pitfall 4) so an already-authenticated session cannot land on it; the page itself must fail closed (no token in sessionStorage → restart state, never render the form) rather than trusting client-visible state                                                                                                                                         |
| V5 Input Validation   | Yes               | New `telegramRegisterSchema` (Zod) validates email/phone/consent shape client-side, backed by backend validation — same division of labor as `registerSchema`                                                                                                                                                                                                                                                                             |
| V6 Cryptography       | No (backend-only) | `id_token` signature verification (RS256) happens exclusively server-side; frontend has zero cryptographic responsibility in this flow                                                                                                                                                                                                                                                                                                    |

### Known Threat Patterns for this stack

| Pattern                                                                                        | STRIDE                                                                         | Standard Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id_token` replay                                                                              | Spoofing                                                                       | Nonce embedded in the `id_token`, verified server-side against the nonce the backend itself issued via `/auth/telegram/nonce` — this is the entire purpose of the nonce round trip `[CITED: core.telegram.org/bots/telegram-login]`                                                                                                                                                                                                                                                                 |
| `registrationToken` reuse/guessing                                                             | Spoofing / Tampering                                                           | One-time-use + 10-minute TTL, enforced authoritatively server-side (frontend's client-side TTL check in Pattern 2 is a UX nicety only, not a security control)                                                                                                                                                                                                                                                                                                                                      |
| Email-conflict disclosure ("this email is already registered")                                 | Information Disclosure                                                         | **Intentionally accepted, not a bug** — unlike LOGIN-02 (which deliberately hides whether an email exists to prevent login-time account enumeration), TG-04 is a _registration-time_ conflict that the product has explicitly decided to disclose (the alternative — silently failing or creating a duplicate account — is worse). Do not "fix" this by genericizing the TG-04 message; it is a deliberate, different tradeoff from LOGIN-02, and the two must not be conflated during code review. |
| COOP-header-induced popup breakage                                                             | Denial of Service (against the login flow itself, not a classic security vuln) | Documented in Pitfall 2 — no current conflict, but must not be introduced later without awareness of this dependency                                                                                                                                                                                                                                                                                                                                                                                |
| XSS via Telegram-supplied `photo_url`/`first_name`/`last_name` rendered in the completion form | Tampering / Information Disclosure                                             | React's default JSX escaping handles the text fields; `photo_url` is rendered via `next/image`'s `src` prop (not `dangerouslySetInnerHTML` or a raw `<img>` with unsanitized attributes), and `next.config.ts`'s `remotePatterns` already restricts loadable image hosts to `**.telegram.org`/`t.me`/`**.t.me` — a malicious `photo_url` pointing elsewhere would be rejected by Next.js's image optimizer, not silently rendered                                                                   |

## Sources

### Primary (HIGH confidence — direct codebase reads, this session)

- `src/shared/lib/platform/adapters/telegram-adapter.ts`, `telegram-adapter.test.ts`, `mock-telegram-env.ts` — confirms this is the unrelated Mini App SDK, not reusable
- `src/shared/ui/icons/telegram-icon.tsx` — existing icon, reused as-is
- `src/views/auth/ui/login-page.tsx`, `register-page.tsx`, `login-page.test.tsx` — current disabled-button state, `ConsentCheckboxes`, form conventions
- `src/features/auth/api/auth-api.ts`, `src/features/auth/index.ts`, `src/features/auth/lib/auth-schemas.ts` — existing API function/schema conventions to extend
- `src/features/auth/lib/registration-notice.ts`, `src/features/auth/ui/registration-notice-listener/registration-notice-listener.tsx` — one-shot sessionStorage flag precedent (now real, executed Phase 2 code, not just Phase 2's research proposal)
- `src/shared/lib/auth/auth-store.ts`, `src/shared/api/api-client.ts` — token storage/refresh mechanics, unchanged this phase
- `src/shared/lib/hooks/use-form-draft.ts`, `use-is-client.ts` — sessionStorage try/catch guard precedent, SSR-safe mount-detection precedent
- `src/shared/model/t-user.ts` — confirms no telegram-specific fields on `TUser` today
- `src/views/profile/ui/profile-page.tsx` — current rows, insertion point for the new disabled hint row
- `src/proxy.ts`, `next.config.ts` — confirms `AUTH_ONLY` gap (Pitfall 4), confirms no COOP header set (Pitfall 2), confirms `next/image` remote-pattern whitelist for `photo_url` already covers Telegram CDN hosts
- `.env.example` — confirms no `NEXT_PUBLIC_TELEGRAM_*` variable exists yet (Assumption A4)
- `docs/features/auth/ACCOUNT_LINKING.md` — superseded overall plan (magic link cancelled), but its documented `409` conflict-response convention for `webRegister` is the closest available precedent for Assumption A2
- `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/config.json`, `.planning/phases/03-telegram-login-registration/03-UI-SPEC.md` — this session
- `.planning/phases/02-email-registration-verification-login/02-RESEARCH.md` — structural/methodological precedent for this document, and confirms the "backend repo unavailable" limitation is a recurring, accepted constraint for this project

### Secondary (MEDIUM confidence — official Telegram documentation, fetched this session)

- [Log In With Telegram](https://core.telegram.org/bots/telegram-login) [CITED] — authorization endpoint (`oauth.telegram.org/auth`), required OIDC parameters (`client_id`, `redirect_uri`, `response_type`, `scope`, `state`, PKCE params, optional `nonce`), `id_token` claim structure, `Telegram.Login.auth()` signature and callback shape (`{ id_token, user, error }`), the `Cross-Origin-Opener-Policy: same-origin` warning, BotFather Client ID/domain-whitelist setup instructions
- [Telegram Login Widget](https://core.telegram.org/widgets/login) [CITED] — `Telegram.Login.auth(InitOptions, callback)` parameter table (`client_id`, `scope`, `lang`, `nonce`), confirms "verify id_token server-side" requirement

### Tertiary (LOW confidence — community/blog sources, fetched this session)

- [How to Add Telegram Login to the Website with new OIDC Flow](https://kulikovd.medium.com/how-to-add-telegram-login-to-the-website-with-new-oidc-flow-4a1bb8ad03c4) — unofficial walkthrough, used only to cross-confirm the general OIDC/PKCE flow shape and BotFather's "OpenID Connect Login" mode toggle exists; this specific article's exact server-side code sample (full redirect + PKCE code exchange) describes a _different_ integration shape than what this project needs (project uses the client-side `Telegram.Login.auth()` popup path with a backend-issued nonce, not a full server-side authorization-code redirect) — used for context only, not as an implementation template
- [react-telegram-login npm package README](https://www.npmjs.com/package/react-telegram-login) — confirmed via WebSearch summary that this package implements the **legacy** hash-based widget, not the OIDC `id_token` flow — cited only to justify the "don't use this package" recommendation in Alternatives Considered

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH for "no new npm dependencies needed" (direct `package.json`/`next.config.ts` reads); MEDIUM for the exact Telegram widget script version/URL (flagged `[ASSUMED]`, must reverify at execution time)
- Architecture: HIGH for composition against this codebase's existing patterns (sessionStorage lifecycle, FSD placement, form conventions — all directly verified); MEDIUM for the OIDC wire-protocol details themselves (sourced from Telegram's official docs this session via WebFetch, not from a live sandbox test against the real bot, since no bot is confirmed configured — see Assumption A4)
- Pitfalls: HIGH for Pitfalls 1, 2, 4, 5 (either directly verified against this codebase or grounded in Telegram's own documented warnings); MEDIUM for Pitfall 3 (version-string specifics); **LOW/flagged-for-confirmation for Pitfall 6 specifically** (the exact email-conflict wire signal — backend repo unavailable, this is the one item in this research that most needs a direct answer before implementation, not just careful defensive coding)

**Research date:** 2026-07-04
**Valid until:** 2026-07-11 (7 days, not the usual 30 — this domain is unusually volatile for two independent reasons: (1) Telegram's own OIDC rollout is recent and could still change script URLs/parameters, and (2) this phase has more unverified backend-contract assumptions than Phase 1/2 combined, A1/A2/A4 should all be confirmed with the backend-agent/user as early as possible rather than let this research go stale)
