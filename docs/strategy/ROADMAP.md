# Дорожная карта (этапы реализации)

## Этап 0: Подготовка бэкенда (Strangle Fig Pattern)

> Подробный план: [`docs/backend/STRANGLE_FIG_MIGRATION.md`](../backend/STRANGLE_FIG_MIGRATION.md)

PK остаётся bigint — Telegram не ломается. Добавляем новое рядом:

1. UUID колонка в User (не меняя PK) — 1 день, риск 0
2. Таблица UserIdentity (platform + externalId) — 2 дня, риск 0
3. JWT + OAuth + magic link в auth.guard — 1 неделя, риск низкий
4. Bull/BullMQ очереди (email, sync) — 1-2 недели, риск 0
5. Тесты на новый код — параллельно

## Этап 1: Web MVP (4-6 недель)

> Архитектура авторизации: [`docs/features/auth/AUTH_ADAPTER.md`](../features/auth/AUTH_ADAPTER.md)

- ✅ Бойлерплейт Next.js 16 + React 19 + Tailwind 4 + DaisyUI 5
- ✅ Весь стек установлен, ESLint + Steiger + Husky настроены
- ✅ Adapter Pattern (platform adapter + api-слой + dev-токен)
- ✅ Каталог + подкаталог + страница товара (публичные эндпоинты)
- ✅ Zustand корзина (localStorage, гостевая)
- ✅ PWA manifest (standalone, без browser chrome на мобилках)
- Перенос остальных shared-компонентов из старого фронта
- Web авторизация (NextAuth — после готовности бэка шаг 3)
- Корзина: sync после логина (`POST /cart/sync`)
- Оплата (ЮKassa виджет), профиль

### TODO: PWA

- Иконки `public/icon-192.png` и `public/icon-512.png` (лого PROSTOR)
- Баннер «Установить приложение» (на 2-3 визит)
- `beforeinstallprompt` для Chrome/Android — перехват и своя кнопка
- iOS инструкция: «Поделиться → На экран Домой»

## Этап 1.5: Water-Pivot (mega-ветка `feature/water-pivot`, экспериментальная)

> Координация: [`docs/feedback/water-map-thread.md`](../feedback/water-map-thread.md)
> Backend: slovo monorepo (отдельный origin `:3101`)

PROSTOR пивотится в сторону карта-first UX вокруг воды. Прямо параллельно с Web MVP.

### Phase 2-4.5: Production UI карты качества воды

- ✅ Phase 2: WaterDrop brand-mark (фирменный знак + sparkle, OKLCH gradient)
- ✅ Phase 3: bottom-nav вкладка «Вода» + route `/water`
- ✅ Phase 4.5: MapLibre GL JS + кастомные controls (вместо NavigationControl)
- ✅ P0 design refresh: OKLCH severity palette + PointPopup + StorePopup + drilling + coverage
- ✅ P1.4-1.6: BottomSheet + sticky-pills accordions + FTUX Variant C (orientation-oriented)
- ✅ P2.7-2.8: cold-load splash + pin-drop ripple animation + a11y 44px touch
- ✅ EquipmentModal v5: МойСклад externalId + presigned imageUrl + cart integration

### Smart Search Phase 1 + iter3 design uplift

- ✅ Multi-modal AI поиск (text + photo) поверх карты (`features/smart-search/`)
- ✅ slovo backend `POST /catalog/search` shape extension: `vision + matchScore`
- ✅ 3 design artifact'а от claude.ai design:
    - Artifact 1: overlay polish (hero card, MatchScoreRing, gradient buttons, sidebar conditional)
    - Artifact 2: LayerPanel 3-glyph SVG set (Сплайн / Точки / Оба)
    - Artifact 3: map layout redesign (Apple Maps style — slim header, glass toolbar, slim AutoEquipmentCard)
- ✅ Defense-in-depth dedupe (backend Phase 1.5 Slice 1 + frontend safety net)
- ✅ Reactive left-edge controls (sync с LayerPanel open state, transition 300ms)

### Phase 1.5+ backlog (не блокирует mega-ветку)

- Address-flow chip → `RealEstatePicker` reuse (полноценный flow вместо placeholder)
- Search relevance category-aware re-ranking (slovo backend) — mechanical filter vs RO
- 401 auth-refresh console noise — pre-flight JWT exp detection (см. `docs/backlog/401-auth-refresh-console-noise.md`)
- Bbox image overlay (annotated bounding boxes)
- Bundled services «Монтаж 2 500 ₽» в product cards
- Voice input (Web Speech API)
- Desktop split-pane с facet filters

## Этап 2: MAX (2-3 недели)

- MaxAdapter поверх готовой архитектуры (SDK почти идентичен Telegram)

## Этап 3: Полный Web (4-6 недель)

- Desktop UI для мастеров/кураторов
- Карта, чат, PWA, SEO
