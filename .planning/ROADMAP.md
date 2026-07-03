# Roadmap: PROSTOR App — Web Auth Rework

## Overview

The web platform currently has no real authentication — every `(web)` page runs on a dev-token workaround. This milestone replaces that with a self-managed JWT flow through `WebAdapter`: token storage/refresh/logout infrastructure first (nothing else can be meaningfully verified without it), then the email register → verify → login vertical slice that gives users a real account, then Telegram as a second way in (or up) for both new and existing users, and finally the identity-consolidation slice — linking Telegram to a password account and letting Telegram-only users set a password — so every user ends up with one account reachable by either method. Each phase ships something a person can actually do in a browser, not a technical layer.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: JWT Session Lifecycle** - Token storage, single-flight refresh, and logout work reliably underneath every future auth flow
- [ ] **Phase 2: Email Registration, Verification & Login** - A user can create an account by email, verify it, and log in — landing in an authenticated personal cabinet
- [ ] **Phase 3: Telegram Login & Registration** - A user can authenticate or register entirely through Telegram, including new-account and email-conflict handling
- [ ] **Phase 4: Account Linking & Password Management** - A logged-in user can link Telegram to a password account, or set a password on a Telegram-only account, and use either method afterward

## Phase Details

### Phase 1: JWT Session Lifecycle

**Goal**: Authenticated requests reliably carry, refresh, and clear JWT tokens across the app — the infrastructure every login/registration flow in later phases depends on. No login flow can be meaningfully tested without this working first.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SESSION-01, SESSION-02, SESSION-03, SESSION-04, SESSION-05
**Success Criteria** (what must be TRUE):

1. Every request to a protected endpoint includes `Authorization: Bearer <accessToken>` when a token is present (visible in the Network tab)
2. When an access token is expired or near expiry, the app transparently calls `POST /auth/web/refresh` and retries the original request — the user notices nothing and stays signed in
3. Firing multiple protected requests at once while the token is expired triggers exactly one `POST /auth/web/refresh` call (single-flight, refresh token rotates); every pending request still succeeds using the refreshed token
4. If the refresh call also comes back 401, all local tokens are cleared and the user is sent back to sign in
5. Triggering logout clears local tokens and ends the session immediately, even if the `POST /auth/web/logout` network call fails or times out
   **Plans**: 2/3 plans executed

- [x] 01-01-PLAN.md — SESSION-01/05 regression tests (Bearer header positive case, direct-call-site audit, logout-survives-network-failure)
- [x] 01-02-PLAN.md — SESSION-02/03 single-flight refresh hardening (static import) + dedup & both-tokens-replaced tests
- [ ] 01-03-PLAN.md — SESSION-04 forced logout+redirect on terminal refresh failure (auth:session-expired event + SessionExpiredListener)

### Phase 2: Email Registration, Verification & Login

**Goal**: A new or returning user can create an account by email, verify their email, and log in by email/password — landing in an authenticated personal cabinet. This phase also introduces the shared auth screen shell (email login / Telegram login / register) that Phase 3 wires Telegram into.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: REG-01, REG-02, REG-03, REG-04, VERIFY-01, VERIFY-02, VERIFY-03, LOGIN-01, LOGIN-02
**Success Criteria** (what must be TRUE):

1. User can fill out the registration form (имя, фамилия, email, телефон, пароль ≥8 символов, 2 чекбокса согласий) and submit it, creating an account via `POST /auth/web/register`
2. After successful registration, the user is immediately authenticated (tokens stored), redirected to the personal cabinet, and sees a "Мы отправили письмо для подтверждения почты" notice
3. Clicking the email verification link (`/verify-email?token=...`) shows "Почта подтверждена"; an unverified user can keep using the app and reach the personal cabinet without any block
4. An authenticated user can request the verification email again (`POST /auth/resend-verification`) without hitting a wall
5. User can log in with existing email/password from the auth screen (which also offers "Войти через Telegram" / "Регистрация"); a wrong email or password shows one generic "Неверная почта или пароль" message that never reveals which part was wrong
   **Plans**: TBD
   **UI hint**: yes

### Phase 3: Telegram Login & Registration

**Goal**: A user can authenticate or register entirely through Telegram from the auth screen built in Phase 2, with new-account detection and email conflicts handled gracefully instead of creating duplicate accounts.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TG-01, TG-02, TG-03, TG-04
**Success Criteria** (what must be TRUE):

1. Clicking "Войти через Telegram" for an existing account runs nonce (`POST /auth/telegram/nonce`) → Telegram Login OIDC → `id_token` → `POST /auth/telegram/login`, and lands the user in the personal cabinet with valid tokens
2. A brand-new Telegram profile (`registrationRequired: true`) is routed to a completion form — имя/фамилия/аватар prefilled from the Telegram profile, email and телефон required, 2 чекбокса согласий, no password field — before `POST /auth/telegram/register` creates the account
3. The `registrationToken` used in that flow lives only in `sessionStorage`, is treated as one-time and 10-minute-lived, and letting it expire (or hitting an ambiguous network error) forces the whole Telegram flow to restart from the beginning rather than failing silently
4. If `POST /auth/telegram/register` reports the email is already taken, no second account is created — the user sees a message redirecting them to email login, and is offered "Привязать Telegram" after logging in there
   **Plans**: TBD
   **UI hint**: yes

### Phase 4: Account Linking & Password Management

**Goal**: A logged-in user can consolidate their identity — linking Telegram to a password account, or setting a password on a Telegram-only account — so they can authenticate through either method afterward.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3
**Requirements**: LINK-01, LINK-02, PASS-01, PASS-02, PASS-03
**Success Criteria** (what must be TRUE):

1. A logged-in email/password user can trigger Telegram linking from their account, complete a fresh nonce → Telegram Login → `POST /auth/telegram/link` round trip, and see Telegram linked to the account
2. After linking, that user can subsequently log in with either email/password or Telegram and lands on the same account
3. A Telegram-only user (no password set) can request "Установить/восстановить пароль" (`POST /auth/forgot-password`) and receive a reset link
4. Following the `/reset-password?token=...` link, the user sets a new password via `POST /auth/reset-password` and sees confirmation
5. After setting a password, that user can subsequently log in with either Telegram or email/password
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase                                       | Plans Complete | Status      | Completed |
| ------------------------------------------- | -------------- | ----------- | --------- |
| 1. JWT Session Lifecycle                    | 2/3            | In Progress |           |
| 2. Email Registration, Verification & Login | 0/TBD          | Not started | -         |
| 3. Telegram Login & Registration            | 0/TBD          | Not started | -         |
| 4. Account Linking & Password Management    | 0/TBD          | Not started | -         |

---

_Roadmap created: 2026-07-03_
