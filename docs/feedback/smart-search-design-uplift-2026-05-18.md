# Smart-search design uplift — заметки 2026-05-18

> Состояние **после Phase 1 frontend закрытия** (commits в `feature/water-pivot`). Backend `POST /catalog/search` живой, контракт Phase 1 closed (`vision: { category, description, confidence }`, `matchScore: 0..100`).
>
> Прошлый design review (2026-05-15) дал HTML prototype `PROSTOR Smart Search.html` — основу взяли, но при импорте в реальный код **получился slightly flat / простенький** для центральной фичи. Просим **polish-итерацию**.

---

## TL;DR

Phase 1 функционально работает (live mobile + desktop, ~500ms backend response, реальные MoySklad results). **Что не нравится разработчику:**

1. Дизайн «простенький», хотя smart-search — **центральная фича** для PROSTOR `/water`. Уровень визуального wow ниже чем у заставки-мультика на cold-load.
2. На mobile **overlay перекрывает контент карты** — съёжено, не понятно куда смотреть.
3. На карте `/water` — **right-side controls (Слои + Zoom +/− + Легенда + FAB)** не гармоничны, накладываются друг на друга и на header «15 504 анализа».
4. В **LayerPanel radio «Сплайн / Точки / Оба»** — странные Unicode-символы (✨/●/⊙), не SVG glyphs.
5. **WaterDrop в chip «Проблема с водой»** среди Heroicons stroke icons (Camera/Hash/Wrench/MapPin) — visual mismatch (один filled-капля, остальные outline).

**Что НЕ ломать (хорошо):**

- WaterDrop+sparkle бренд-marker (OKLCH gradient 232°→250°→270°) — узнаваем
- Cold-load splash «мультик» — **круто**, держим как точка эстетики
- Bottom-sheet pattern на mobile (drag handle + swipe-down)
- Glass-style FAB / controls (`bg-base-100/95 backdrop-blur`)
- 2×2 grid на desktop overlay results — структурно правильно

---

## 6 pain points по скринам

### 1. Mobile `/water` idle — header «съёжен», SmartSearchInput stack'нут под двумя cards

📷 `screenshots/01-mobile-idle.png`

Top 200px viewport на 390×844 содержит **3 stacked cards подряд**:

1. **Header bar** PROSTOR + burger (~56px)
2. **Карточка «Карта качества воды · Москва и Подмосковье · 15 504 анализа»** + square button «Слои» справа (~72px)
3. **SmartSearchInput pill** «🔵 Умный поиск · текст или фото [📷]» (~44px) — центральная фича, но визуально равна остальным cards

**Что не работает:**

- 3 элемента top boxed → юзер не знает «где главное?»
- «15 504 анализа» **визуально перекрыто** square кнопкой «Слои» справа (последний character truncated)
- SmartSearchInput выглядит как **ещё один тех-control**, не как entry-point центральной фичи
- Right column ниже: square «Слои» → zoom +/− → AutoEquipmentCard «8 проблем» — **5 cards в правой колонке** на 390px viewport

**Хочется:**

- Чёткая визуальная иерархия: SmartSearchInput **главный**, остальное вторично
- Заглавная фраза «Карта качества воды · 15 504 анализа» — компактнее, можно одним subtitle pill размер с map controls
- Map controls (Слои / Zoom) **компактнее** или group'нуть в одну vertical bar

---

### 2. Mobile smart-search overlay (idle) — flat-minimalist, не feels premium

📷 `screenshots/02-mobile-overlay-idle.png`

Bottom-sheet 50% viewport. Header «🔵 Умный поиск AI» + ×, input, 5 chips, recent searches, footer hint.

**Что не работает:**

- Background **plain white** — никаких градиентов, depth, brand vibe
- Chips серые с тонким border — выглядят как стандартные daisyui pills, не feels AI
- «🔵 Умный поиск AI» badge маленький — central feature не имеет визуального hero
- Footer «найдём оборудование за 1 секунду» — мелкий text, теряется
- WaterDrop в chip «Проблема с водой» **filled bold** среди остальных Heroicons stroke (Camera/`#`/Wrench/MapPin) — visual mismatch

**Хочется:**

- Hero AI-vibe в header — large WaterDrop + sparkle на gradient bg, как у prototype Section 02
- Chips — больше brand-coherent (subtle gradient hover, soft shadow на active, не plain border)
- Background — мягкий gradient или sublime water-pattern (low opacity)

---

### 3. Mobile smart-search overlay (results) — cards flat-stacked

📷 `screenshots/03-mobile-overlay-results.png`

Cards списком vertically (1-column). Image 100×100 + category tag + name + description + matchScore badge + price + 2 buttons «Подробнее»/«В корзину».

**Что не работает:**

- Cards выглядят как **e-commerce listing** (Wildberries / Ozon стиль), не как **AI recommendations**
- matchScore badge `95%` — мелкий синий в правом-верхнем углу, не привлекает внимания
- Category tag «ОБРАТНЫЙ ОСМОС < 15000» — uppercase noise (часть `< 15000` это ценовой диапазон зашит в MoySklad категорию)
- Split actions «Подробнее»/«В корзину» — equal weight, не понятно primary
- **Vision badge** (когда `vision !== null` для image-search) — **отсутствует** на mobile (фронт скрывает потому что нет места)

**Хочется:**

- Cards с **AI vibe** — relevance score визуально prominent (large number или meter), не tiny badge
- Vision badge **уживается на mobile** — компактный «AI распознал: обратный осмос · 91%» сверху списка
- Primary action **«В корзину» visually dominant**, «Подробнее» secondary (ghost variant)

---

### 4. Mobile LayerPanel — Сплайн/Точки/Оба Unicode эмодзи

📷 `screenshots/04-mobile-layerpanel-radio.png`

Radio group в trio:

- **«✨ Сплайн»** — sparkles emoji (heatmap blob mode)
- **«● Точки»** — bullet (individual analysis points)
- **«⊙ Оба»** — circled dot (combined view)

**Что не работает:**

- Unicode-символы — не SVG, **рендерятся разными шрифтами на iOS/Android/Chrome** (visual inconsistency)
- ✨ sparkles → для AI features, тут означает heatmap **smooth blob** — confusing semantic
- ⊙ circled dot — слишком похож на ● bullet, юзеру не различить

**Хочется:**

- 3-icon set, SVG, единый stroke style (как Heroicons): какой-то «cloud / blob» для Spline, «scatter dots» для Точки, «layered» для Оба
- Активный state — primary fill + соответствующий outline-glyph

---

### 5. Desktop `/water` idle — right-side controls не гармонично

📷 `screenshots/05-desktop-idle.png`

Layout: PROSTOR header (~56px) + LayerPanel sidebar 280px left + map + footer-nav (Каталог/Вода/Корзина).

На map area:

- **Top-left card** «Карта качества воды · Москва и Подмосковье · 15 504 анализа» + square «Слои» button right (collision)
- **SmartSearchInput pill** ~440×44px, centered top
- **Right-top**: square «Слои» button (ещё один?)
- **Right-middle**: Zoom +/− stack
- **Right-bottom**: «Уровни» legend card + FAB «Прогноз» (capли icon, синий)
- **Bottom-center**: AutoEquipmentCard «8 По вашему адресу: 8 проблем» — wide blue card накладывается на map

**Что не работает:**

- Right column controls (Слои + Zoom + Легенда + FAB) — **4 separate plate'а**, не выровнены, не grouped
- AutoEquipmentCard перекрывает heatmap центральной зоны — important но не должен blocking
- SmartSearchInput sticky-top — на desktop **смотрится одиноко**, без context AI vibe

**Хочется:**

- Right-side **vertical toolbar** — group в одну `bg-base-100/95 backdrop-blur` panel (как Apple Maps): Слои + Zoom + Прогноз FAB вместе, не порознь
- Легенда «Уровни» — может в expandable popover при hover на heatmap-toggle, не permanent card
- AutoEquipmentCard — `lg:max-w-md` + position bottom-right, не center (освобождает heatmap viewport)

---

### 6. Desktop smart-search overlay (results) — 2×2 grid правильно, но «простенький»

📷 `screenshots/06-desktop-overlay-results.png`

Modal `max-w-5xl` (1024px) + 2×2 grid 4 cards. Каждая card horizontal layout (image left 80×80 + name + description + matchScore + price + actions).

**Что не работает:**

- **Нет AI vision sidebar** — на desktop image-search prototype Section 04 имел `[280px AI vision preview | 1fr cards grid]`. Сейчас только cards grid, vision хедер inline без visual hero
- Cards визуально **те же что mobile** — без desktop-specific polish (hover states, secondary detail на hover)
- Background backdrop blur **slate-light** — нет depth между modal и map
- «← Новый поиск» bottom-link — заглушенный, не attention CTA для refinement flow

**Хочется:**

- Когда `vision !== null` (image-search) → **left sidebar 280px** с AI preview (photo thumb + category + confidence indicator + «Уточнить» link). Когда text-only → modal остаётся wide grid без sidebar
- Cards hover state — subtle lift + shadow + show preview / additional info
- Modal hero header — gradient strip или sparkle accent на top edge (brand-coherent)

---

## Что НЕ менять (inherited design system)

- **OKLCH palette** — severity 4 уровня + aquifer 5 горизонтов
- **WaterDrop+sparkle brand-marker** gradient 232°→250°→270° + sparkle
- **BottomSheetModal pattern** mobile — drag handle, swipe-down dismiss
- **Glass-style FAB / controls** — `bg-base-100/95 backdrop-blur shadow-md rounded-xl`
- **Phase 1 backend contract** — `matchScore: 0..100`, `vision: { category, description, confidence: low|mid|high } | null`
- **Recommendation-card shape** — image + category tag + name + description + matchScore badge + price + split actions
- **Cold-load splash animation** «мультик» — это якорь эстетики, держим как пример полноценного visual treatment

---

## Backend Phase 1 contract — что доступно artist'у

Response от `POST /catalog/search`:

```jsonc
{
    "docs": [
        {
            "metadata": {
                "externalId": "moysklad-uuid",
                "name": "Аквафор DWM-101S",
                "description": "Обратносмотическая система повышенной производительности...",
                "categoryPath": "Очистка воды/Аквафор/Фильтры с краном/Обратносмотические системы < 15000",
                "salePriceKopecks": 1290000,
            },
            "imageUrls": ["https://signed-minio-url"],
            "matchScore": 95,
        },
    ],
    "vision": {
        "category": "обратный осмос",
        "description": "Компактная система под мойку, белый корпус, 4 колбы",
        "confidence": "high", // 'low' | 'mid' | 'high'
    },
    "count": 4,
    "timeTakenMs": 493,
}
```

- `vision: null` для text-only search
- `vision.confidence === 'low'` → UX-prompt «Не уверен что распознал. Может опишите словами?»
- `categoryPath` — `/`-разделённый, последний segment иногда содержит ценовой диапазон `< 15000` (MoySklad-feeder noise)
- `matchScore` сейчас rank-based (95..45), Phase 2 переедет на cosine (0..100 точный)

---

## Связанные документы

- `water-map-smart-search-design-review-2026-05-15-PROMPT.md` — прошлый design review (HTML prototype)
- `slovo/docs/features/smart-search-integration.md` — план фичи Phase 1 / 1.5 / 2
- `slovo/docs/features/prostor-water-pivot.md` — карта-first позиционирование PROSTOR
- `water-map-thread.md` — append-only лог между slovo-claude и prostor-claude (Phase 1 backend handoff + iter1/iter2 acceptance)
