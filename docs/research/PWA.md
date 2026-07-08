# PWA (Progressive Web App) — Исследование

> **Статус:** Исследование
> **Дата:** Январь 2025
> **Вывод:** Для Telegram Mini App полноценный PWA избыточен

---

## Итоговое решение

**PWA не рекомендуется** для данного проекта по следующим причинам:

### Почему НЕ нужен PWA

| Причина | Пояснение |
|---------|-----------|
| Telegram кэширует | WebView Telegram имеет собственный кэш для статики |
| Нет standalone режима | Пользователи открывают приложение через Telegram, не "устанавливают" его |
| Service Worker ограничен | В WebView работает нестабильно, особенно background sync |
| Offline бесполезен | Без интернета невозможно: оформить заказ, синхронизировать данные, получить актуальные цены |
| Корзина синхронна с бэком | Данные не теряются — синхронизация с сервером уже реализована |

### Что реально поможет при медленном интернете

| Решение | Сложность | Эффект |
|---------|-----------|--------|
| Skeleton loading | Низкая | Улучшит UX при загрузке |
| Оптимизация изображений (webp, lazy load) | Низкая | Быстрее загрузка |
| RTK Query `keepUnusedDataFor` | Низкая | Меньше рефетчей |
| Сжатие бандла (gzip/brotli на сервере) | Средняя | Быстрее загрузка JS |

---

## Текущее состояние проекта

### Что уже есть ✅

| Компонент | Статус | Файл |
|-----------|--------|------|
| manifest.json | Базовый | `public/manifest.json` |
| Ссылка на manifest в HTML | Есть | `index.html` |
| HTTPS для разработки | Есть | `vite-plugin-mkcert` |
| RTK Query кэширование | Базовое | Все API slices |
| Синхронизация корзины с бэком | Есть | `use-cart-synchronization.ts` |

### Что отсутствует (и не требуется)

| Компонент | Статус | Нужен? |
|-----------|--------|--------|
| Service Worker | Нет | ❌ Не нужен |
| vite-plugin-pwa | Не установлен | ❌ Не нужен |
| redux-persist | Не установлен | ❌ Корзина синхронна с бэком |
| Offline Queue | Нет | ❌ Не нужен |

---

## Ограничения Telegram Mini App

### Особенности WebView

1. **Service Worker** — работает, но с ограничениями
2. **Background Sync** — не работает при сворачивании Telegram
3. **Push Notifications** — только через Telegram Bot API
4. **localStorage** — ограничен, лучше использовать sessionStorage

### Текущие решения в проекте

- ✅ sessionStorage для startParam
- ✅ Redux Store синхронизируется при каждом монтировании
- ✅ Корзина синхронизируется с бэкендом с debounce 250ms

---

## Справочная информация (если понадобится в будущем)

<details>
<summary>План внедрения PWA (на будущее)</summary>

### Фаза 1: Базовый PWA

#### Установка зависимостей

```bash
npm install vite-plugin-pwa workbox-window
npm install -D @vite-pwa/assets-generator
```

#### Обновление vite.config.ts

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Aquaphor Pro Store',
        short_name: 'Aquaphor',
        theme_color: '#00a3e1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ]
});
```

#### Meta-теги для index.html

```html
<meta name="theme-color" content="#00a3e1"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<link rel="apple-touch-icon" href="/icon-192.png"/>
```

</details>

<details>
<summary>Network Status Hook (на будущее)</summary>

```typescript
import { useState, useEffect, useCallback } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(
    navigator.onLine ? 'online' : 'offline'
  );

  const updateNetworkStatus = useCallback(() => {
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    const connection = (navigator as any).connection;
    if (connection && ['slow-2g', '2g'].includes(connection.effectiveType)) {
      setStatus('slow');
      return;
    }

    setStatus('online');
  }, []);

  useEffect(() => {
    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [updateNetworkStatus]);

  return { status, isOnline: status !== 'offline' };
};
```

</details>

---

## Полезные ссылки

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
