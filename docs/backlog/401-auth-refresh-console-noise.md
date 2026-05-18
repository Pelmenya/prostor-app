# 401 auth-refresh — console noise (backlog)

> **Статус:** отложено (2026-05-17). Не блокер, логика работает корректно.
> Создан после slovo Playwright sweep smart-search Phase 1 — slovo пометил 🟢
> non-blocker, Дима подтвердил deferred. См. `docs/feedback/water-map-thread.md`
> message от 2026-05-17 11:25.

## Что происходит

На cold load `/water` (и других страниц с auth-gated endpoints) DevTools console
показывает 4 красные строки:

```
[ERROR] 401 Unauthorized @ https://newly-wired-grouse.cloudpub.ru/cart
[ERROR] 401 Unauthorized @ https://newly-wired-grouse.cloudpub.ru/real-estate
[ERROR] 401 Unauthorized @ https://newly-wired-grouse.cloudpub.ru/push/status
[ERROR] 401 Unauthorized @ https://newly-wired-grouse.cloudpub.ru/cart
```

## Почему это происходит

Sequence работает **корректно** (нет functional regression):

1. Cold load → useAuthStore hydrate → `accessToken` present (от прошлой сессии,
   localStorage persist)
2. Endpoints с `enabled: isAuthenticated` дёргаются с этим (expired) token
3. Backend `crm-aqua-kinetics-back` возвращает **401 Unauthorized**
4. `apiClient` (`src/shared/api/api-client.ts:51-61`) перехватывает 401 →
   вызывает `tryRefreshTokens()` → backend `POST /auth/web/refresh` → 201 Created
   с новой парой токенов
5. `apiClient` retry'ит исходный запрос с новым Bearer → 200 OK
6. TanStack Query получает успешный result, всё работает

**Console errors — это browser DevTools behavior** на HTTP 4xx/5xx responses.
Chrome логирует каждый fetch с status >= 400 как красную строку в Console tab,
**даже если у нас в коде нет `console.error`**. Через JavaScript подавить нельзя
(это devtools network logging).

## Почему guards недостаточно

Все 3 endpoint'а уже правильно guarded:

| Endpoint       | Где                                                                 | Guard                                  |
| -------------- | ------------------------------------------------------------------- | -------------------------------------- | --- | ------------------------- |
| `/cart`        | `src/features/cart/lib/use-cart-backend-sync.ts:218`                | `enabled: isAuthenticated && !isGuest` |
| `/push/status` | `src/features/push-notifications/lib/use-push-notifications.ts:93`  | `if (!IS_SUPPORTED                     |     | !isAuthenticated) return` |
| `/real-estate` | `src/views/water-map/ui/real-estate-picker.tsx` (mounted+auth gate) | external wrapper                       |

Guards проверяют **наличие** token, не **валидность**. Если token expired —
guards его всё равно считают «authenticated», и запрос летит → 401.

## Что нужно сделать

**Pre-flight expired-token detection в `apiClient`:**

1. Парсить JWT `exp` claim из `accessToken` (стандартный JWT base64-decode, без
   подписи — нужен только claim).
2. Перед `fetch()` проверять: если `exp * 1000 < Date.now() + SKEW_MS` (skew 30s
   на clock drift) → вызывать `tryRefreshTokens()` **до** первого запроса.
3. После refresh — нормальный flow.

**Сложность:** ~40-60 мин + риск сломать auth (на `shared/api/api-client.ts`
нет прямого test coverage для refresh flow). Требует:

- Helper `parseJwtExp(token: string): number | null` в `shared/lib/auth/`
- Update `apiClient` чтобы проверять exp перед fetch
- Возможно update `useApi` hook чтобы skew/refresh обрабатывался в request lifecycle
- Тесты на: expired + valid + не-JWT token + refresh-failure paths

**Альтернатива (cheaper):** только в `useApi`/`apiClient`, не trogать call sites.

## Когда делать

После завершения Auth Adapter Pattern Step 2 (NextAuth integration) — там и так
будет рефактор auth flow. Bundle'нуть pre-flight detection в этот scope.

Связано:

- `docs/features/auth/AUTH_ADAPTER.md` — auth архитектура
- `docs/feedback/water-map-thread.md` (2026-05-17 11:25 + 11:40 messages)
