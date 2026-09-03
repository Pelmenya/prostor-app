# PWA + Web Push — руководство для разработки

## Что уже сделано

- **Service Worker** (`public/sw.js`) — обработка push-событий и кликов по уведомлениям
- **PWA манифест** (`public/manifest.json`) — name, icons, display: standalone
- **Иконки** — `icon-192.png`, `icon-512.png`, `badge-72.png`, `apple-touch-icon.png`
- **Feature модуль** `features/push-notifications/` (FSD):
    - `api/push-api.ts` — subscribe, unsubscribe, status, test, broadcast
    - `lib/use-push-notifications.ts` — хук состояния подписки
    - `lib/use-pwa-detect.ts` — определение iOS / standalone
    - `lib/vapid-key.ts` — конвертация VAPID ключа
    - `ui/push-toggle.tsx` — toggle + кнопки тест/broadcast
    - `ui/push-promo-banner.tsx` — промо-баннер для неподписанных
- **Backend endpoints** (`/push/*`):
    - `POST /push/subscribe` — сохранить подписку
    - `DELETE /push/unsubscribe` — удалить подписку
    - `GET /push/status` — проверить подписан ли
    - `POST /push/test` — тестовый пуш себе
    - `POST /push/broadcast` — пуш всем подписанным

## Переменные окружения

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<публичный VAPID ключ>
```

### Backend (`.env`)

```env
VAPID_PUBLIC_KEY=<тот же публичный ключ>
VAPID_PRIVATE_KEY=<приватный ключ — только в .env, никогда в git>
VAPID_SUBJECT=mailto:pro.store@aquaphor.store
```

**Генерация ключей:** `npx web-push generate-vapid-keys`

**Важно:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` на фронте = `VAPID_PUBLIC_KEY` на бэкенде. Приватный ключ — секрет, хранится только в `.env` бэкенда. При пересоздании ключей старые подписки перестанут работать.

## Как это работает

```
1. Пользователь нажимает «Включить»
2. Браузер спрашивает разрешение → requestPermission()
3. Service Worker регистрируется → navigator.serviceWorker.register('/sw.js')
4. Браузер подписывается у Push Service (Google FCM / Apple APNs / Mozilla)
5. Получаем endpoint + keys → POST /push/subscribe → сохраняем в БД
6. Бэкенд шлёт пуш → webPush.sendNotification(endpoint, keys, payload)
7. Push Service доставляет → Service Worker → showNotification()
```

## Поддержка платформ

| Платформа                        | Поддержка | Нюансы                                |
| -------------------------------- | --------- | ------------------------------------- |
| **Chrome** (Windows/Mac/Android) | ✅        | Работает из коробки                   |
| **Firefox** (Windows/Mac)        | ✅        | Работает из коробки                   |
| **Edge** (Windows/Mac)           | ✅        | Работает из коробки                   |
| **Safari macOS** 16+             | ✅        | Работает из коробки                   |
| **Safari iOS** 16.4+             | ⚠️        | **Только в PWA** (Add to Home Screen) |
| **Chrome iOS**                   | ❌        | Apple не разрешает, только Safari     |
| **Firefox iOS**                  | ❌        | Apple не разрешает, только Safari     |

### iOS — обязательные требования

1. **iOS 16.4+** — на более ранних версиях Web Push не работает
2. **Только Safari** — другие браузеры на iOS не поддерживают Push
3. **Только PWA** — сайт должен быть добавлен на домашний экран
4. **HTTPS** — обязательно (localhost работает для разработки)
5. **Manifest** — `display: "standalone"`, валидные иконки, `id`, `scope`

## Как подключить PushToggle

```tsx
import { PushToggle } from '@/features/push-notifications';

// В любом клиентском компоненте:
<PushToggle />;
```

Toggle автоматически:

- Скрывается если Push не поддерживается
- Показывает текст если пуши заблокированы в браузере
- Синхронизирует состояние с бэкендом

## Как подключить PushPromoBanner

```tsx
import { PushPromoBanner } from '@/features/push-notifications';

// В любом клиентском компоненте (страница, view):
<PushPromoBanner />;
```

Баннер автоматически:

- Скрывается если уже подписан или закрыл (✕)
- На iOS без PWA — показывает инструкцию установки
- На десктопе/Android — показывает кнопку «Включить»

## Тестирование

### Быстрый тест (десктоп)

1. Запустить бэкенд (`docker compose -f docker-compose.dev.yml up --build`)
2. Запустить фронт (`npm run dev`)
3. Открыть `http://localhost:3010/catalog`
4. Залогиниться
5. Toggle в хедере → включить → разрешить уведомления
6. Нажать 🔔 — должен прийти пуш «PROSTOR — тест»
7. Нажать 📢 — пуш всем подписанным

### Тест на iPhone

1. Фронт должен быть доступен по HTTPS (туннель: cloudpub, ngrok и т.д.)
2. Открыть URL в **Safari** на iPhone
3. Нажать кнопку «Поделиться» (квадрат со стрелкой вверх) → «На экран Домой»
4. Открыть приложение с домашнего экрана (не из Safari!)
5. Залогиниться
6. Баннер предложит включить уведомления → нажать «Включить»
7. iOS покажет системный диалог разрешения → «Разрешить»
8. С десктопа нажать 📢 → пуш должен прийти на iPhone

### Частые проблемы

| Проблема                             | Причина                         | Решение                                               |
| ------------------------------------ | ------------------------------- | ----------------------------------------------------- |
| Toggle не показывается               | `PushManager` недоступен        | Проверить HTTPS, iOS — только PWA                     |
| 401 при подписке                     | JWT протух                      | Перелогиниться                                        |
| Пуш не приходит на iPhone            | Не PWA или уведомления выкл.    | Настройки → Уведомления → PROSTOR                     |
| Несколько пушей                      | Дубли подписок в БД             | `DELETE FROM push_subscription;` и подписаться заново |
| Hydration mismatch                   | Компонент рендерится на сервере | Обернуть в `useSyncExternalStore` проверку mounted    |
| PROSTOR нет в списке уведомлений iOS | PWA не зарегистрировался        | Удалить с домашнего экрана, добавить заново           |

## Генерация иконок

При обновлении логотипа:

```bash
node scripts/generate-icons.js
```

Генерирует из SVG: `icon-192.png`, `icon-512.png`, `badge-72.png`, `apple-touch-icon.png`. Использует `sharp` (идёт с Next.js).

## Структура файлов

```
public/
├── sw.js                    # Service Worker (push + notificationclick)
├── manifest.json            # PWA манифест
├── icon-192.png             # Иконка 192x192
├── icon-512.png             # Иконка 512x512
├── badge-72.png             # Badge для пуша
├── apple-touch-icon.png     # Иконка для iOS

src/features/push-notifications/
├── api/
│   └── push-api.ts          # API: subscribe/unsubscribe/status/test/broadcast
├── lib/
│   ├── use-push-notifications.ts  # Хук состояния подписки
│   ├── use-pwa-detect.ts          # Определение iOS / standalone
│   ├── vapid-key.ts               # Конвертация base64url → Uint8Array
│   └── vapid-key.test.ts          # Тест
├── ui/
│   ├── push-toggle.tsx            # Toggle + кнопки тест/broadcast
│   └── push-promo-banner.tsx      # Промо-баннер для неподписанных
└── index.ts                       # Public API
```

## Что дальше

- **Убрать тестовые кнопки** (🔔, 📢) из PushToggle перед продом
- **Дизайн баннера** — сейчас стандартный DaisyUI alert, нужно обыграть
- **Emit событий на бэкенде** — подключить реальные уведомления (заказы, картриджи) когда появятся страницы в вебе
- **localStorage для dismissed** — сейчас баннер появляется заново при перезагрузке
