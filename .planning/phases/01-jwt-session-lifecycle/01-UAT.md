---
status: testing
phase: 01-jwt-session-lifecycle
source: [01-VERIFICATION.md]
started: 2026-07-03T16:30:00Z
updated: 2026-07-03T16:30:00Z
---

## Current Test

number: 1
name: SESSION-04 real-browser forced redirect
expected: |
Log in on the web app, invalidate the refresh token server-side (or wait past its expiry),
stay on a private page (e.g. /orders), trigger any protected request, and observe the browser.
Expected: the browser navigates to /login?from=%2Forders without any manual reload or navigation.
awaiting: user response

## Tests

### 1. SESSION-04 real-browser forced redirect

expected: Log in, invalidate the refresh token server-side (or wait past its expiry), stay on a private page (e.g. /orders), trigger a protected request, observe the browser navigate to /login?from=%2Forders without manual reload/navigation.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
