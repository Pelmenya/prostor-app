# Технологический стек мультиплатформенного фронтенда

> **Статус:** Решение принято
> **Дата:** 12.03.2026
> **Решение:** Next.js 16 + React 19 для всех платформ (Web + Mini Apps)

---

## Решение

Переход с текущего стека (Vite + React 18 + React Router) на **Next.js 16 + React 19** для единого фронтенда, обслуживающего Web, Telegram Mini App и MAX Mini App.

### Почему Next.js для всего, а не два проекта

- Один репозиторий, один деплой, один набор компонентов
- SSR/SSG для веба (SEO, каталог товаров в поисковиках)
- SPA-режим для Mini Apps через `'use client'` layout
- App Router заменяет React Router
- Image Optimization, Middleware, API Routes из коробки

### Почему не оставить Vite для Mini App отдельно

- Дублирование компонентов, стилей, бизнес-логики
- Два проекта поддерживать = двойная работа
- Рассинхрон фич между платформами

---

## Стек

### Ядро

| Пакет          | Версия    | Зачем                                                    | Заменяет                |
| -------------- | --------- | -------------------------------------------------------- | ----------------------- |
| **Next.js**    | 16.x      | Фреймворк, SSR/SSG, App Router                           | Vite 5 + React Router 6 |
| **React**      | 19.x      | React Compiler — автоматическая мемоизация               | React 18                |
| **TypeScript** | 6.x → 7.x | 6 = мост, 7 = Go-компилятор (10x быстрее, середина 2026) | TS 5.4                  |

### UI

| Пакет            | Версия | Зачем                                         | Заменяет             |
| ---------------- | ------ | --------------------------------------------- | -------------------- |
| **Tailwind CSS** | 4.2.x  | CSS-утилиты, v4 = CSS-based конфиг            | Tailwind 4.0.7       |
| **DaisyUI**      | 5.5.x  | UI-компоненты поверх Tailwind, вышел в stable | DaisyUI 5.0.0-beta.8 |

### State & Data

| Пакет               | Версия | Зачем                                                 | Заменяет                    |
| ------------------- | ------ | ----------------------------------------------------- | --------------------------- |
| **TanStack Query**  | 5.90.x | API-слой, кэширование, мутации, refetch on focus, SWR | RTK Query 2.5.1             |
| **Zustand**         | 5.0.x  | Клиентский UI state + persist (localStorage)          | Redux Toolkit + React Redux |
| **React Hook Form** | 7.x    | Управляемые формы                                     | Без изменений               |
| **Zod**             | 3.x    | Runtime validation (TS-инференс типов из схем)        | Без изменений               |
| **date-fns**        | 4.x    | Работа с датами                                       | Без изменений               |

**Решение пересмотрено** в Phase 1 (Web MVP): после оценки RTK Query vs TanStack
Query на реальных кейсах (каталог, корзина, water-analysis) — TanStack даёт
лучше DX (queryKey-based кэш, suspense-режим, infinite queries встроены),
плюс Zustand для UI-state легче чем Redux store с slices. Если в будущем понадобится
shared business state между фичами с time-travel debugging — можно вернуть RTK,
но пока TanStack + Zustand покрывают все use cases.

### Аутентификация

| Пакет                        | Версия    | Зачем                                                    | Заменяет                                   |
| ---------------------------- | --------- | -------------------------------------------------------- | ------------------------------------------ |
| **NextAuth / Auth.js**       | 4.x / 5.x | Логин/пароль, Яндекс ID (OAuth), magic link, JWT, сессии | Telegram initDataRaw (единственный способ) |
| **@telegram-apps/sdk-react** | 3.x       | Для Telegram Mini App layout                             | 2.0.20                                     |

### Платежи

| Пакет             | Версия | Зачем                             | Заменяет              |
| ----------------- | ------ | --------------------------------- | --------------------- |
| **ЮKassa виджет** | —      | Прямая интеграция без мессенджера | Telegram Payments API |

---

## React 19 — ключевые улучшения

### React Compiler (автоматическая мемоизация)

Компилятор автоматически оптимизирует ререндеры. Больше не нужны:

- `useMemo()` — компилятор сам определяет что кэшировать
- `useCallback()` — функции мемоизируются автоматически
- `React.memo()` — компоненты оптимизируются без обёртки

**Для нас:** при переносе компонентов на React 19 можно убрать все ручные `useMemo`/`useCallback` — код станет чище и проще.

### Server Components

- Компоненты по умолчанию серверные (без `'use client'`)
- Меньше JS на клиенте, быстрее загрузка
- Для веба: каталог, карточки товаров — серверные компоненты
- Для Mini App: layout с `'use client'`, всё как SPA

### Прочее

- `use()` хук — промисы и контекст без useEffect
- Actions — серверные мутации
- Улучшенная гидратация

---

## TypeScript 6 → 7 (Go)

### TS 6.x (сейчас, мост)

- Последний релиз на JS-компиляторе
- Deprecated: ES5 target, AMD/UMD, classic module resolution
- Совместим с текущим кодом

### TS 7.x (середина 2026, Go)

- Компилятор переписан на Go (Project Corsa, Anders Hejlsberg)
- **10x быстрее** компиляция
- `strict: true` по умолчанию
- Выкинуты ES5, AMD, UMD, SystemJS
- Можно обновиться плавно — стартуем на 6, переходим на 7 когда выйдет

---

## Архитектура Next.js: два layout'а

```
app/
├── (web)/                      — Web-версия (SSR)
│   ├── layout.tsx              — Header, Footer, Navigation
│   ├── page.tsx                — Landing / Каталог
│   ├── login/                  — логин/пароль + OAuth (Яндекс ID)
│   ├── register/               — регистрация + подтверждение email/телефона
│   ├── reset-password/         — сброс пароля через email
│   ├── magic/                  — magic link (вход из Telegram/MAX в веб)
│   ├── catalog/                — SSR каталог (SEO)
│   ├── orders/                 — История заказов
│   └── profile/                — Профиль
│
├── (miniapp)/                  — Mini App (SPA, 'use client')
│   ├── layout.tsx              — Без header, initData авторизация
│   ├── page.tsx                — Главная Mini App
│   ├── catalog/                — Каталог (клиентский рендер)
│   ├── orders/                 — Заказы
│   └── profile/                — Профиль
│
├── api/                        — BFF (опционально)
│   └── auth/
│       └── [...nextauth]/      — NextAuth endpoints
│
└── shared/                     — Общие компоненты, хуки, утилиты
    ├── components/
    ├── hooks/
    ├── lib/
    │   └── platform/           — Adapter Pattern (Telegram/MAX/Web)
    └── styles/
```

### Как это работает

- **(web)** layout — серверный, SSR, `NextAuth` сессии, стандартная навигация
- **(miniapp)** layout — клиентский (`'use client'`), авторизация через `initDataRaw` (Telegram) или `initData` (MAX)
- **shared/** — бизнес-логика, UI-компоненты, TanStack Query hooks, общие для обоих layout'ов
- Один деплой, один домен, разные точки входа

---

## Что переезжает без изменений

- DaisyUI компоненты + Tailwind стили
- Бизнес-логика (хуки, утилиты, типы)
- date-fns форматирование

## Что нужно переписать

- React Router → App Router (маршрутизация)
- RTK Query (старый фронт) → TanStack Query + Zustand (PROSTOR)
- `useMemo` / `useCallback` / `React.memo` → убрать (React Compiler)
- Telegram SDK прямые вызовы → Platform Adapter
- Аутентификация → мульти-auth (NextAuth + initData)

---

## Миграция: текущий фронт → Next.js

### Этап 1: Скаффолдинг (2-3 дня)

- Создать Next.js 16 проект
- Настроить Tailwind 4 + DaisyUI 5
- Настроить TanStack Query (QueryProvider в layout) + Zustand stores
- Два layout'а: (web) и (miniapp)

### Этап 2: Перенос компонентов (1-2 недели)

- Скопировать shared-компоненты
- Убрать useMemo/useCallback/React.memo
- Адаптировать под App Router (page.tsx, layout.tsx)

### Этап 3: Web авторизация (1 неделя)

- NextAuth с логин/пароль провайдером
- Login/Register страницы

### Этап 4: Mini App layout (3-5 дней)

- Перенести Telegram SDK интеграцию
- Platform Adapter

### Этап 5: Тестирование (1 неделя)

- Web в браузере
- Mini App в Telegram WebView

---

**Дата:** 12.03.2026
**Автор:** Дмитрий Ляпин
