# Water-map + Smart-Search · design review · 2026-05-15

> **Назначение:** контекст-документ для **claude.ai design** (новый chat, не продолжение прошлого review). Описывает state of art карты `/water` после недели работы (P0/P1/P2 + equipment-suggest v5 + image-tunnel-fix + glass FAB rollback) + early prototype фичи **«Умный поиск»** который тебе нужно доработать как **интеграцию в /water interface**.
>
> **Дата:** 2026-05-15
> **Состояние:** дизайн-followup от 2026-05-14 закрыт полностью (8 wave'ов). Сейчас открываем **новую фичу** — smart-search, и хотим органично встроить его в /water.

---

## TL;DR

**Что построили за неделю** (после твоего review 2026-05-14):

1. **OKLCH palette refresh** — severity (4 уровня) + aquifer (5 горизонтов khaki-вместо-green a11y fix) + brand
2. **PointPopup proposed** — hero risk-circle 100/100 + at-a-glance gradient bar + `×8.3 ПДК` per param + sticky CTA
3. **FTUX Variant C** — «Узнайте, что у вас в воде» (orientation-headline) + иконка-пин + exit-link
4. **StorePopup V1+V2** — mini-card (30% screen) + tab-based pull-up с inventory check (МойСклад proxy `/retail-stores/:id/inventory-check`)
5. **BottomSheet sticky-pills + 3 accordions** — Слои / Местоположение / Аналитика, Zustand persist
6. **Pin-drop animation** — каждый pin падает с bounce + ripple-волной (CSS-only)
7. **Cold-load splash 2.5s** — синий занавес → капля → heatmap reveal → callout (`?demo=1` для презентаций)
8. **A11y fixes** — 44px touch targets, custom MapZoomControls (вместо MapLibre default), `h-[85dvh]` iOS Safari
9. **equipment-suggest v5** — `externalId` (MoySklad UUID) + presigned `imageUrl` + `salePriceKopecks` в одном response. Recommendation cards в EquipmentModal с реальными фото товаров, ценой, deep-link `/product/{id}` + кнопкой «В корзину»
10. **Image-tunnel-fix** — S3_ENDPOINT через cloudpub tunnel, MoySklad photos грузятся через https
11. **Glass FAB rollback** — water-drop icon в white-glass card (унифицирован с MapZoomControls + кнопка «Слои»)

---

## Design system inherited (НЕ менять без обоснования)

Эти решения вышли из твоего review 2026-05-14 и **применены** в коде. Не трогай — используй как foundation для smart-search.

### OKLCH palette

```css
:root {
    /* Severity — 4 уровня, semantic intent fixed */
    --severity-safe: oklch(72% 0.16 150); /* green — В норме (≤ ПДК) */
    --severity-borderline: oklch(82% 0.16 95); /* yellow — На границе ПДК */
    --severity-concerning: oklch(72% 0.18 50); /* orange — Возможно проблема */
    --severity-unsafe: oklch(62% 0.22 25); /* red — Превышение ПДК */
    --severity-stroke: oklch(40% 0.005 285 / 0.3); /* 1.5px на borderline */

    /* Aquifer — 5 горизонтов, REFRESHED (a11y fix deuteranopia) */
    --aquifer-vrkh: oklch(50% 0.09 55); /* Верховодка 0-15м */
    --aquifer-pesch: oklch(68% 0.12 95); /* Песчаный 15-50м — khaki, БЫЛО green */
    --aquifer-pesch-izv: oklch(70% 0.1 195); /* Песч.-извест. 50-100м — teal */
    --aquifer-izv: oklch(55% 0.18 250); /* Известняковый 100-200м — blue */
    --aquifer-artez: oklch(48% 0.2 305); /* Артезианский 200м+ — purple */

    /* Brand — theme-aware через daisyui tokens */
    --color-primary: theme-aware (light/dark переключает hue 263° → 277°)
        --color-info: oklch(74% 0.16 232) /* gradient-end, logo */ --color-base-100: theme-aware;
}
```

### Glass-style controls pattern

Все map controls справа (top-right «Слои» FAB + zoom +/− + bottom-right SimilarFab) используют **white glass card**:

```css
.glass-control {
    background: oklch(100% 0 0 / 0.95); /* base-100 / 0.95 */
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
    border-radius: 12px;
    /* icon внутри — brand-primary fill, читается */
}
```

Это унифицирует map controls — не сливаются с pin'ами/AutoEquipmentCard (которые brand-primary blue).

### BottomSheetModal pattern (8 modal'ов унаследовали)

- **Backdrop:** `bg-black/30 backdrop-blur-sm` (не solid)
- **Drag handle:** `w-12 h-1` сверху mobile sheet, `sm:hidden`
- **Swipe-down dismiss** mobile: pointer events Y дельта → translateY follow → release > 100px → close
- **iOS Safari body scroll lock:** `position: fixed; top: -scrollY; width: 100%`
- **footer prop:** CTA как `shrink-0` sibling scroll-area (не sticky) — content физически не проезжает за CTA на dark theme

### FTUX hint-card (Variant C — Refined as-is)

```
┌──────────────────────────────────────┐
│  💧  Узнайте, что у вас в воде        │
│      Прогноз химии и подбор фильтра   │
│      по соседним анализам             │
│                                       │
│  [ Узнать химию воды по адресу  ]    │  ← primary CTA
│                                       │
│        Или посмотрите без пина →      │  ← exit-link, session dismiss
└──────────────────────────────────────┘
```

- Иконка-пин в `bg-primary/15` circle (left)
- Orientation-headline («что я тут делаю»), не action-headline («что сделать»)
- Single primary CTA + exit-link

---

## Сцены current state (7 скринов)

См. `screenshots/sweep-2026-05-15/`:

| #   | Viewport     | Сцена                                                                                                                              |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Mobile 390   | `sweep-01-mobile-ftux.png` — guest FTUX                                                                                            |
| 02  | Mobile 390   | `sweep-02-mobile-pin-autocard.png` — pin Кашира + AutoEquipmentCard «4 проблемы / 5 рекомендаций» + glass FAB                      |
| 03  | Mobile 390   | `sweep-03-mobile-equipment-modal.png` — EquipmentModal v5 (cards с реальными фото товаров + цены + кнопки «Подробнее»/«В корзину») |
| 04  | Mobile 390   | `sweep-04-mobile-point-popup.png` — PointPopup proposed (Скважина 86м, hero risk 100, ×ПДК per param)                              |
| 05  | Desktop 1280 | `sweep-05-desktop-default.png` — sidebar layout (360px)                                                                            |
| 06  | Desktop 1280 | `sweep-06-desktop-pin-autocard.png` — pin + sidebar + AutoEquipmentCard                                                            |
| 07  | Desktop 1280 | `sweep-07-desktop-equipment-modal.png` — EquipmentModal centered, карта вокруг видна                                               |

---

## Smart-search — early prototype (твоя ранняя наработка)

См. `screenshots/sweep-2026-05-15/smart-search-early-prototype.png`.

Ты сам сделал mockup в claude.ai design — есть **direction**:

### 3 mobile states (flow)

| State                   | Содержание                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Idle** (стартовый) | Phone mockup + заголовок «Умный поиск» + search input «Опишите проблему или сфотографируйте» + camera icon + chip-suggestions («Жёсткая вода / Запах / Ржавчина / Подбор фильтра») + быстрые сценарии («Калибровка для DMM 105» / «Чистая вода») |
| **2. Loading**          | Photo thumbnail (если юзер загрузил) + progress steps «Видим что на фото → Подбираем товары → ...» — visible AI process, не black-box spinner                                                                                                    |
| **3. Results**          | AI-badge «AI видит: фильтр-кувшин» + vision description + product cards (Аквафор DMM-105 49 990 ₽, Кристалл OS-04 18 990 ₽) — те же recommendation-cards что в EquipmentModal v5                                                                 |

### Branding — «капля + sparkle»

В prototype отдельная секция «Капля «Умный поиск» — фирменный AI-маркер» — water-drop + sparkle симбиоз. **НЕ Sparkles only**, не Target — именно **water-drop с sparkle** как единый знак. Это уже brand-direction решённый.

### Что есть в prototype но требует доработки

- **Точка интеграции в клиентскую главную** — в prototype есть схема user-flow, но **детали** где именно в /water entry-point: header / FAB / overlay / отдельный bottom-tab? Это **ключевой UX-вопрос**.
- **Desktop версия** — prototype mobile-only. Как этот flow адаптируется к 1280px sidebar?
- **Mapping в существующие компоненты** — наш EquipmentModal v5 уже отдаёт product cards с реальными фото/ценой/кнопками. Smart-search **должен использовать ту же recommendation-card structure**, не изобретать новую. Должны ли результаты smart-search показываться в **том же** EquipmentModal или отдельный SmartSearchModal?

---

## Задача claude design

**Доработай smart-search integration в существующий /water interface** на основе:

- Твой own early prototype (`smart-search-early-prototype.png`) — направление
- Текущее состояние 7 скринов (что НЕ менять — то что уже работает)
- Design system inherited выше — palette, glass-controls, BottomSheet pattern, FTUX V-C

### Минимум 5 обязательных artifact'ов (HTML/CSS, рендеримые)

| #   | Artifact                                                                                                                                                           | Mobile 390         | Desktop 1280 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------ |
| 1   | **Точка входа** — где в /water юзер открывает smart-search? (header icon? FAB на карте? specialty entry в bottom-sheet?)                                           | ✓                  | ✓            |
| 2   | **Idle state** — search input + chip-suggestions + быстрые сценарии. Mobile bottom-sheet или full-screen, desktop sidebar/modal                                    | ✓                  | ✓            |
| 3   | **Loading state** — visible AI progress (текст + animated icons) — без black-box spinner                                                                           | ✓                  | ✓            |
| 4   | **Results state** — AI-badge с vision description + product cards (используй наш existing recommendation-card design из `sweep-03-mobile-equipment-modal.png`)     | ✓                  | ✓            |
| 5   | **Branding icon** — финальный SVG «капля + sparkle» — что-то типа single AI-маркер используется и в FAB-entry, и в badge, и в loading. **Один знак** для всей фичи | mobile размер 24px | desktop 32px |

### Дополнительно (text-only, приоритет ниже но welcome)

- 📝 **Mapping в existing flow** — где smart-search ⊆ EquipmentModal vs где SmartSearchModal отдельно? Когда юзер ставит pin → AutoEquipmentCard → EquipmentModal с auto-recommendations. Когда нет pin → smart-search через input. Должны ли эти flow merge'аться в один modal?
- 📝 **Voice input** — Web Speech API → voice → transcription → search. Это **Phase 2** (после text+photo), но если есть UX-thoughts — отметь
- 📝 **A11y** — touch targets 44px, voice-button focus management, screen-reader announcements для AI-states

### Стек constraints (НЕ трогать)

- Next.js 16 + maplibre-gl 5.20 + daisyui + TanStack Query
- Backend готов: `POST /catalog/search` body `{query: string, topK?: 5, imageBase64?: string}` → returns top-K с `imageUrls` presigned + `metadata.externalId/name/salePriceKopecks` (тот же shape что equipment-suggest v5 — reuse cards)
- Throttle 10/min/IP — **search-on-submit** (Enter/button), не on-typing
- Multi-modal сразу — text + camera. Photo через `imageBase64` в request, до 5 фото
- OKLCH palette, daisyui theme-aware (light/dark)
- RU-only (no translation infrastructure)

### Workflow

Начинай с **artifact #5 (branding icon)** — это foundation для всех остальных artifact'ов (будет использоваться в #1/#2/#3 как FAB-entry / loading / badge).

Затем #1 (entry-point) → #2 (idle) → #3 (loading) → #4 (results).

После каждого artifact'a — краткий review (3-5 bullets «что улучшено / trade-offs»).

После 5 artifact'ов — text-only sections (mapping в existing flow + voice + a11y).

---

## Что НЕ нужно

- ❌ Полная замена EquipmentModal v5 — он работает, reuse recommendation-card structure
- ❌ Chat-style multi-turn UI — Phase 1 single-shot (input → results). Phase 2 conversational backlog
- ❌ Менять design-system (palette, glass-controls, BottomSheet pattern) без обоснования
- ❌ Воспроизводить mobile FTUX V-C в smart-search — это разные entry-points (FTUX = onboarding для guest, smart-search = поиск товара)
- ❌ Удалять existing фичи — smart-search **дополняет** карту, не заменяет

---

## Источники

- `screenshots/sweep-2026-05-15/sweep-01..07-*.png` — 7 current state скринов после недели работы
- `screenshots/sweep-2026-05-15/smart-search-early-prototype.png` — твой ранний prototype (direction)
- `docs/feedback/water-map-design-review-2026-05-14.md` + `PROMPT.md` — context первого review (закрыт)
- `docs/feedback/water-map-claude-design-followup-2026-05-14.md` — план применения первого review (закрыт)
- `docs/feedback/water-map-thread.md` — append-only лог обсуждений slovo-claude ↔ prostor-claude (28 итераций)
