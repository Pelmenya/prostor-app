---
status: passed
phase: 01-jwt-session-lifecycle
source: [01-VERIFICATION.md]
started: 2026-07-03T16:30:00Z
updated: 2026-07-03T17:47:30Z
---

## Current Test

(none — all tests complete)

## Tests

### 1. SESSION-04 real-browser forced redirect

expected: Log in, invalidate the refresh token server-side (or wait past its expiry), stay on a private page (e.g. /orders), trigger a protected request, observe the browser navigate to /login?from=%2Forders without manual reload/navigation.
result: PASS — verified via Playwright MCP against dev server (localhost:3050) + live backend tunnel. Logged in with real test account, corrupted `prostor_access_token`/`prostor_refresh_token` in localStorage + `access_token` cookie, navigated to `/profile`. Client-side fetches to `/api/cart` and `/api/push/status` got 401, `apiClient` attempted `POST /auth/web/refresh` which failed (500 — invalid refresh token), tokens were cleared and `auth:session-expired` was dispatched. `SessionExpiredListener` caught the event and called `router.push` to `/login?from=%2Fprofile` with no manual reload/navigation. Confirmed via `browser_snapshot` (final URL) and `browser_console_messages` (network trail).

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
