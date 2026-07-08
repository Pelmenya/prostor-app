---
phase: 03
slug: telegram-login-registration
status: cancelled
cancelled_at: 2026-07-08
---

# Phase 3 — Cancelled

**Решение:** продукт отказался от Telegram Login (веб OIDC-вход через Telegram Login Widget) как способа аутентификации на вебе. Остаётся только собственный JWT-флоу через email/пароль (Phase 1/2). Telegram Mini App вью-слой (`TelegramAdapter`, `(miniapp)` layout, `initDataRaw`) это решение не затрагивает — он не относится к веб-аутентификации и остаётся как есть.

**Что откачено:**

- Wave 1 (план `03-01`) был выполнен и смержен в `feature/web-auth-rework` (TG-01 5-состояний Telegram-кнопка на `login-page.tsx`, OIDC-транспорт `use-telegram-oidc.ts`, sessionStorage-цикл регистрации `telegram-registration.ts`, API-функции `telegramNonce`/`telegramLogin`/`telegramRegister`) — откачено через `git revert` (коммиты `5e2e422`, `2f02dff`), история сохранена.
- Wave 2 (планы `03-02`, `03-03`) не были запущены — отменены до исполнения.

**Что остаётся в этой папке:** `03-RESEARCH.md`, `03-PATTERNS.md`, `03-UI-SPEC.md`, `03-VALIDATION.md`, `03-01/02/03-PLAN.md` — оставлены как исторический артефакт планирования, не как активный контракт. Не использовать как референс для будущей реализации без явного нового решения продукта.

**Влияние на Phase 4:** Phase 4 (Account Linking & Password Management) зависел от Phase 3 (привязка Telegram к аккаунту) — тоже отменён, см. `ROADMAP.md`.

См. `ROADMAP.md` и `PROJECT.md` (Key Decisions) для полной трассировки решения.
