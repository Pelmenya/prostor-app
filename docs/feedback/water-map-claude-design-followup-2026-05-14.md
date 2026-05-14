# Water-map · claude design follow-up · 2026-05-14

> **Назначение:** план применения output'а claude design review к коду `prostor-app/src/widgets/water-map/`.
>
> **Источник:** `prostor-app/PROSTOR Water-Map Review.html` — 6 HTML/CSS mockup'ов в iframe + 13 вариантов внутри + scenario review + IA tap-count + a11y audit.
>
> **Контекст:** mobile-first review (24 скрина, из них 11 mobile). Desktop версии отложены — см. секцию «Desktop deferred» внизу.

---

## TL;DR

claude design выдал глубже чем заказывали — реальный data-driven review с ΔE/ΔH измерениями, OKLCH parameters explicit и tap-count IA таблицей. Применяем в 3 волны:

| Wave                | Задачи                                                                  | Risk   | Effort  |
| ------------------- | ----------------------------------------------------------------------- | ------ | ------- |
| **P0 этот спринт**  | OKLCH palette refresh + PointPopup proposed + FTUX CTA copy             | low    | 4-6h    |
| **P1 следующий**    | StorePopup mini-card + BottomSheet sticky-pills + Mobile FTUX Variant C | medium | 1-2 дня |
| **P2 демо-уровень** | Wow-splash 2.5s + a11y fixes (aria-labels, 44px, dvh, reduced-motion)   | low    | 1 день  |

**Главный gem** — IA tap-count табличка: FTUX CTA copy change «Использовать геолокацию» → **«Узнать химию воды по адресу»** сокращает path с 5 тапов до 2 для most-common задачи. 1-line change. Anchor для всего P0.

---

## P0 · этот спринт · viewport-agnostic critical fixes

### 🔴 1. OKLCH palette refresh — **a11y FAIL fix**

**Проблема (из artifact #6):** `severity-safe-green` и `aquifer-Песчаный-green` живут на одном hue (ΔH 5°, ΔE ≈ 8) — deuteranopia (8% мужчин) **не различает** safe water dot от Песчаный аквифер cell, когда оба слоя ON одновременно (см. сцены `05-desktop-drilling-depth-map` + `21-mobile-drilling-depth-map`).

**Решение:** сдвинуть aquifer-Песчаный с H150 (green) в H95 (khaki). Сохраняет gradient «тёплое поверхность → холодное глубоко». ΔH 5° → 55°, ΔE ≈ 8 → 35.

**Дополнительно — severity-borderline на CARTO Voyager basemap (#F8F5EF):** ΔE ≈ 24, almost invisible. Fix — добавить тонкий тёмный stroke 1.5px на dots.

#### CSS variables (готов к копипасту)

```css
:root {
    /* Severity — 4 уровня, semantic intent fixed */
    --severity-safe: oklch(72% 0.16 150); /* green — В норме (≤ ПДК) */
    --severity-borderline: oklch(82% 0.16 95); /* yellow — На границе ПДК */
    --severity-concerning: oklch(72% 0.18 50); /* orange — Возможно проблема */
    --severity-unsafe: oklch(62% 0.22 25); /* red — Превышение ПДК */
    --severity-stroke: oklch(40% 0.005 285 / 0.3); /* 1.5px на borderline */

    /* Aquifer — 5 горизонтов, REFRESHED */
    --aquifer-vrkh: oklch(50% 0.09 55); /* Верховодка 0-15м (was brown) */
    --aquifer-pesch: oklch(68% 0.12 95); /* Песчаный 15-50м — khaki, БЫЛО green H150 */
    --aquifer-pesch-izv: oklch(70% 0.1 195); /* Песч.-извест. 50-100м — teal */
    --aquifer-izv: oklch(55% 0.18 250); /* Известняковый 100-200м — blue */
    --aquifer-artez: oklch(48% 0.2 305); /* Артезианский 200м+ — purple */

    /* Store availability — 3 состояния */
    --avail-full: oklch(76% 0.18 163);
    --avail-partial: oklch(82% 0.19 84);
    --avail-closed: oklch(71% 0.19 13);
    --avail-nodata: oklch(85% 0 0);

    /* Brand */
    --brand-primary: oklch(54% 0.245 263); /* CTA, gradient-start */
    --brand-info: oklch(74% 0.16 232); /* gradient-end, logo */
    --brand-tint: oklch(96% 0.02 232); /* selected real-estate */
}
```

#### Применение

1. Положить в `prostor-app/src/app/globals.css` (после tailwind imports).
2. Замапить на daisyui semantic tokens (`--p` / `--s` / etc.) где нужно — но severity/aquifer/availability оставить **direct CSS vars**, не через daisyui, т.к. semantic intent fixed.
3. В `WaterMap` widget'е заменить hardcoded цвета (если есть `#22c55e` / `rgba(...)` в layer config'ах) на `oklch(...)` через `getComputedStyle` или прямо вкомпилить.
4. **`maplibre paint` expressions** — maplibre понимает `oklch(...)` начиная с v4. Если на v5.20 — должно работать, проверь рендер heatmap-color.

#### ⚠️ Дополнение про stores

claude design нашёл второй overlap: `severity-borderline (H95)` ≈ `availability-partial (H84)` — yellow dot vs yellow store ring. **Решение уже на месте**: stores это иконки в форме (white circle + colored ring), не plain dots. Паттерн **сохранять** — никогда не использовать «фоновый круг availability» размером с severity dot.

---

### 🔴 2. PointPopup proposed — **value-driver**

**Проблема (из artifact #3):** current PointPopup (см. `22-mobile-point-popup.png`):

- Risk score «100/100» мелким текстом — momentary truth не видна сразу
- Severity breakdown как color-coded bullets — нет at-a-glance
- **Каждый exceeded param показывает только raw value** — нет «× ПДК», юзер не знает «насколько превышено»
- CTA «Подобрать оборудование» уходит **ниже fold'a** — sticky отсутствует
- Все 4 severity sections expanded по умолчанию → 21+ строка контента, scroll required

**Proposed (artifact #3 right panel):** см. iframe artifact #3 в `PROSTOR Water-Map Review.html`.

#### Compositional changes

```
┌──────────────────────────────────────┐
│  ⭕ 100   Скважина · 86 м          [×] │   ← hero risk-circle
│   риск   Московская обл · 26.11.2024  │
│          ▓▓▓▓▓▓░░░░ 4·3·1·6           │   ← at-a-glance bar (gradient)
│          4 ПДК · 3 возм · 1 гран · 6 ↑│
├──────────────────────────────────────┤
│ ● Превышение ПДК · 4         критично│   ← expanded by default
│   Марганец (Mn)         0.830 мг/л   │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬ ×8.3 ПДК            │   ← per-param × ПДК + progress
│   Железо (Fe, суммарно) 3.12  мг/л   │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬ ×10.4 ПДК           │
│   ...                                 │
├──────────────────────────────────────┤
│ ● Возможно проблема · 3            ▾ │   ← collapsed
├──────────────────────────────────────┤
│ ● На границе нормы · 1             ▾ │   ← collapsed
├──────────────────────────────────────┤
│ ● В норме · 6                      ▾ │   ← collapsed
└──────────────────────────────────────┘
│  [ Подобрать оборудование под анализ ]│   ← sticky bottom
│     4 фильтра по найденным проблемам  │
└──────────────────────────────────────┘
```

#### Что нового на уровне компонентов

| Component           | Source       | Tasks                                                                    |
| ------------------- | ------------ | ------------------------------------------------------------------------ |
| `<RiskHeroCircle>`  | новый        | большой круг с числом 0-100 + цвет по severity                           |
| `<AtAGlanceBar>`    | новый        | gradient line с пропорциями 4·3·1·6 + numeric label                      |
| `<ParamRow>`        | существующий | добавить `×ПДК` text + horizontal progress bar (red fill = exceedsRatio) |
| `<SeveritySection>` | существующий | `defaultExpanded` prop — `true` только для unsafe                        |
| Sticky footer CTA   | существующий | wrap в `position: sticky; bottom: 0` + counter «N фильтров»              |

#### Backend контракт — **уже есть всё нужное**

```jsonc
{
  "intakeType": "well",
  "depthMeters": 86,
  "risk": 100,             // hero circle
  "params": {              // per-param raw values
    "manganese": 0.830,
    "iron_total": 3.12,
    ...
  },
  "pdkExceedanceRatio": {  // ← новое, нужно поднять с бэка
    "manganese": 8.3,
    "iron_total": 10.4,
    ...
  }
}
```

**TODO для slovo-claude (я):** добавить `pdkExceedanceRatio` в `/points` response + `/heatmap/cell` response. Считаем как `value / pdkSpec[paramCode].max` для каждого exceeded. Лёгкий backend-change (15 min) — пишу в follow-up handoff.

---

### 🔴 3. FTUX CTA copy change — **1-line uplift**

**Проблема (из IA tap-count таблицы):** «Что у меня в воде?» сейчас = **5 тапов** (pin → bottom-sheet → param-pill → FAB → modal). Target = **2 тапа**.

**Insight:** FTUX CTA copy «Использовать геолокацию» — **низкий information-scent**. Юзер не понимает что произойдёт после тапа.

**Fix:** заменить copy на **«Узнать химию воды по адресу»**.

#### Code change

Файл: `prostor-app/src/widgets/water-map/...` (там где FTUX hint-card; точное место не знаю, ищи по «Использовать геолокацию»).

```diff
- <button>Использовать геолокацию</button>
+ <button>Узнать химию воды по адресу</button>
```

После тапа behavior **не меняем** — геолокация + `setPin` + auto-open PredictModal на ближайшем pin. Меняется только **expectation** юзера = меняется conversion rate без backend.

**Заодно:** второй маленький button «На карте» оставить как secondary — для дилеров кто знает координаты клиента.

---

## P1 · следующий спринт · UI components

### 🟡 4. StorePopup → Mini-card (Variant 1) + Tab-based pull-up (Variant 2)

**Источник:** artifact #4 в HTML review, 3 варианта.

**Default (Variant 1 — Mini-card):**

- Bottom-sheet занимает **~30% screen** вместо 60%
- 2 кнопки: «Маршрут» (primary) + «Детали» (secondary)
- Карта остаётся видимой — юзер может сравнивать stores не закрывая popup

**On swipe-up (Variant 2 — Tab-based) — progressive disclosure:**

- 3 таба: «Магазин / Маршрут · 25 мин / Корзина (14)»
- Tab «Магазин» — **«В наличии 12 из 14 в корзине», «Нет в наличии: Фильтр Кристалл Н, Сменный модуль K3»** — это flagship feature, на рынке такого нет
- Tab «Корзина» — shortcut на основной /cart

**Variant 3 (Action-first)** — оставляем как option **только для авторизованных дилеров** (route — основной flow). Не default.

**Backend контракт** — нужны:

- `cartItems[]` с per-item availability в этом конкретном store (cross-check `/cart` items vs `/retail-stores/{id}/inventory`)
- API endpoint TODO: `GET /retail-stores/{id}/inventory?cartItemIds=...` — возвращает `{ available: [...], outOfStock: [...] }`

Если endpoint'а нет — Variant 1 deployable as-is (без «12 из 14 в корзине» tab — это P1.5).

### 🟡 5. BottomSheet IA → Sticky pills + accordions (Variant B)

**Источник:** artifact #2, Variant B.

**Изменения:**

- `param-pills` + `ViewMode` toggle всегда наверху bottom-sheet'a, **`position: sticky; top: 0`** внутри scrollable area
- «Слои на карте · 5» → collapsible accordion section, **expanded by default**
- «Ваше местоположение» (Real Estate + Геолокация/На карте) → collapsible, **collapsed by default** для guest, **expanded** для authed-с-pin'ом
- «Аналитика по району» (Похожие анализы + Тип воды) → collapsible, **collapsed by default**
- **Persist accordion state per session** (localStorage) — иначе frustration на каждом open/close

**Все 7 toggles + 6 pills + RealEstatePicker сохраняем** — это reorganization, не removal.

### 🟡 6. Mobile FTUX → Variant C (Refined as-is)

**Источник:** artifact #1, Variant C.

**Изменения по сравнению с current:**

- **Иконка-пин в карточке** = семантическая привязка к «месту»
- Заголовок переписан с «что сделать» (action-oriented) на **«что я тут делаю»** (orientation-oriented): «Узнайте, что у вас в воде» вместо «Поставьте пин»
- Кнопки сохраняем (Геолокация / На карте), но **primary** = новая CTA из P0.3 «Узнать химию воды по адресу»
- «Или посмотрите без пина →» оставляем как exit-link

**Variant B (Map-first immersion)** — оставить **за feature-flag** для landing-кампаний. A/B test когда дойдут до маркетинга. Сейчас не делаем.

---

## P2 · демо/wow

### 🟢 7. Wow-splash 2.5s

**Источник:** artifact #5 в HTML review (playable preview есть в iframe).

**Раскадровка:**

- 0.0-0.6s: синий «занавес» с PROSTOR + drop pattern (закрывает первый сетевой запрос карты — не пустой spinner)
- 0.6-1.1s: капля воды падает с верха, «занавес» стекает каплеподобной формой
- 1.1-1.4s: heatmap reveal радиально из точки падения
- 1.7-2.1s: pin падает на Каширу + bounce + ripple-волна
- 2.1-2.5s: callout «1 817 анализов» + sticky CTA «Узнать химию воды по адресу»

**КЛЮЧЕВОЕ:** sub-animation **pin-drop + ripple — переиспользуется в production при каждом `setPin()`**. Это не одноразовая демо-анимация, а production-feature.

**Когда играет полная 2.5s сцена:** только cold-load + `?demo=1` route для презентаций руководителю.

CSS-only, без JS framework — берётся прямо из iframe artifact #5.

### 🟢 8. A11y fixes (все WARN/FAIL из audit)

| Issue                           | Severity       | Fix                                                                                                 |
| ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| Map controls aria-labels        | FAIL           | `map.addControl(new NavigationControl({...}))` — добавить i18n RU labels («Приблизить», «Отдалить») |
| Param-pills 32px                | WARN           | `min-height: 44px` (Apple HIG) + tighter horizontal padding для preserved visual                    |
| SeverityLegend «i» 32×32        | WARN           | `min-width: 44px; min-height: 44px` — visual oblong 32px остаётся через padding                     |
| `h-[85vh]` на bottom-sheet      | WARN (iOS 16+) | `h-[85dvh]` + `h-[85vh]` fallback                                                                   |
| Pin animation на reduced-motion | WARN           | `@media (prefers-reduced-motion: reduce) { animation: fade-in 0.3s; }` — без bounce                 |

---

## Desktop deferred

claude design сделал все 6 mockup'ов **mobile-only 390×844** — это правильно для нашего priority (mobile = main audience). Desktop версии **3 из 6 mockup'ов** реально отличаются:

- **#2 BottomSheet** → desktop = sidebar 340px, не bottom-sheet
- **#4 StorePopup** → desktop = popup, не bottom-sheet
- **#1 FTUX** → desktop = full-screen splash или modal, не hint-card

**Стратегия:** сначала применяем P0/P1/P2 на mobile, frontend-агент адаптирует под desktop по существующим паттернам в `prostor-app`. Если визуально не работает — **focused** prompt для claude design только на 3 проблемных кусках. **Не повторяем** review полностью.

Триггеры для повторного запроса к claude design:

- Frontend-агент адаптировал и **визуально не работает**
- Перед демо руководителю Аквафор — нужен visual refinement
- Дойдём до Equipment-modal / Predict-modal (фичи 14-16) — там mockup'ов нет вообще

---

## Verification checklist

После применения каждой волны — **slovo-claude (я) делаю Playwright sweep** с mobile 390 + desktop 1280 и пишу в этот thread `acknowledged` с before/after скринами.

### P0 acceptance criteria

- [ ] OKLCH palette — открыть `/water` с включенными Качество ON + Глубина ON одновременно, severity-green vs aquifer-Песчаный визуально различаются (deuteranopia simulator в Chrome DevTools для проверки)
- [ ] PointPopup — клик на well 86м (Кашира → 38.155, 54.84 → zoom 14 → click) показывает hero-100, at-a-glance bar, ×ПДК у Mn и Fe, sticky CTA
- [ ] FTUX CTA — incognito mode, открыть `/water` без auth, на экране **«Узнать химию воды по адресу»**

### P1 acceptance criteria

- [ ] StorePopup открывается как ~30% sheet, swipe-up раскрывает tab-based с inventory
- [ ] BottomSheet pills sticky при scroll, accordions persist (refresh страницы не resetит)
- [ ] FTUX Variant C — иконка-пин в карточке, новый заголовок

### P2 acceptance criteria

- [ ] `/water?demo=1` показывает 2.5s splash sequence
- [ ] Reduced-motion OS-setting → splash fade-in без bounce
- [ ] DevTools Lighthouse a11y score ≥ 95
- [ ] Все map controls имеют русские aria-labels

---

## Что **НЕ** делаем

- ❌ **Не меняем backend контракты** (кроме `pdkExceedanceRatio` field — он additive)
- ❌ **Не удаляем фичи** — все 7 toggles + 6 pills + RealEstatePicker остаются (reorganize, не remove)
- ❌ **Не trogaем `wm-stores` source unwrap bug** в этой волне (известный — TBD отдельной задачей)
- ❌ **Не делаем Variant A FTUX (gamified 3-step) и Variant 3 StorePopup (action-first)** — отложены как A/B option

---

## Источники

- `prostor-app/PROSTOR Water-Map Review.html` — главный artifact с 6 iframe mockup'ов + scenario review + IA + a11y
- `prostor-app/docs/feedback/water-map-design-review-2026-05-14.md` — context-документ который кидался дизайнеру
- `prostor-app/docs/feedback/water-map-design-review-2026-05-14-PROMPT.md` — финальный prompt
- `prostor-app/docs/feedback/screenshots/review-2026-05-14/` — 24 PNG (11 mobile + 13 desktop)
