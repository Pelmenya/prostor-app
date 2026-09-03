# Prompt для claude design — water map review 2026-05-14

> Copy-paste этот текст в новый chat на claude.ai/design.
> Прикрепи к чату: `water-map-design-review-2026-05-14.md` + папку `screenshots/review-2026-05-14/` (**24 PNG, из них 11 mobile**).

---

Привет! Это design review карты `/water` в PROSTOR — водо-aware приложение Аквафор-Pro.

Мы построили карту-помощник для покупателя водоочистного оборудования (B2C + B2B drilling).
15 504 анализа воды Подмосковья за 2020-2026, kNN-прогнозы по координатам, drilling-stats,
точки продаж + native polyline route. **16 фич на одной maplibre-карте.**

Полный контекст + 24 скрина + UX-вопросы + constraints — в прикреплённом markdown.

⚠️ **MOBILE — ГЛАВНЫЙ ПРИОРИТЕТ** review. **11 из 24 скринов — mobile 390×844 (iPhone 14 Pro)**:

```
02-mobile-default-risk.png            Guest FTUX (first-touch)
07-mobile-aquifer-stats-modal.png     AquiferStatsModal full-screen
16-mobile-authed-sheet-real-estate.png Authed bottom-sheet
17-mobile-authed-with-pin-stores.png  Authed pin + stores layer
18-mobile-bottom-sheet-layers.png     ⭐ САМАЯ НАГРУЖЕННАЯ — 7 toggles + 6 pills + RealEstatePicker
19-mobile-all-params-modal.png        22 параметра full-screen
20-mobile-coverage-only.png           Coverage solo (Качество OFF)
21-mobile-drilling-depth-map.png      B2B USP-4 + AquiferLegend
22-mobile-point-popup.png             Скважина 86м risk 100/100 — 4 severity levels
23-mobile-store-popup.png             ФМ Курс Ступино 25 мин — bottom-sheet вариант
24-mobile-route-polyline.png          Кашира → Ступино, синяя polyline
```

13 desktop 1280 — для context, **не главный фокус**.

---

## ⚠️ ГЛАВНОЕ: HTML/CSS MOCKUPS В ARTIFACT'АХ

Мне нужны **рендеримые HTML/CSS artifact'ы**, не только review текстом.

**Минимум 6 обязательных artifact'ов** — все mobile-first (`<meta viewport>` + 390px container):

### 1. 🎨 Mobile FTUX redesign (scenario `02-mobile-default-risk.png`)

Гостевой first-touch. Сейчас 2 button row + hint card. Мало контекста зачем юзеру тут.

HTML artifact с **3 variants**:

- **Variant A** — gamified «3 step» onboarding (Step 1 — выберите регион / Step 2 — поставьте пин / Step 3 — увидите проблемы воды)
- **Variant B** — minimal-text full-immersion: карта без overlay'ев + sticky bottom CTA «Что у меня в воде?»
- **Variant C** — «as is» refined: тот же layout, но лучше typography / spacing / контраст текста

### 2. 🎨 BottomSheet IA alternative (scenario `18-mobile-bottom-sheet-layers.png`)

**САМАЯ НАГРУЖЕННАЯ MOBILE-СЦЕНКА.** 7 layer-toggle'ей + 6 param-pills + ViewModeToggle + RealEstatePicker + 2 кнопки «Геолокация / На карте» + Аналитика по району section. Тащит ~1500px scroll внутри bottom-sheet.

HTML artifact с **2 alternative layouts**:

- Reorganization через tabs / accordion / collapsed-by-default secondary section
- Сохрани **все 7 toggle'ей + 6 pills + RealEstatePicker** — только reorganize visual hierarchy и reduce scroll-depth до ≤2 viewport'ов

### 3. 🎨 PointPopup mobile typography refresh (scenario `22-mobile-point-popup.png`)

PointPopup на mobile = bottom-sheet с 4 severity sections + 22 params + CTA. 21+ строка контента, scroll required.

HTML artifact:

- Improved info density (collapsible secondary sections «Возможно проблема» + «В норме» свёрнуты по умолчанию)
- **Comparison side-by-side**: current vs proposed (на mobile = swipeable tabs или vertical split)
- Highlight: где CTA остаётся sticky, header summary с risk-score, severity color rhythm
- Sticky-footer CTA «Подобрать оборудование под анализ» (вместо scroll-to-bottom)

### 4. 🎨 StorePopup mobile-first (scenarios `23-mobile-store-popup.png` + `24-mobile-route-polyline.png`)

Bottom-sheet с store details + route CTA. На mobile сейчас закрывает **~40% screen**, но карта частично видна. После build route — карта показывает polyline + popup остаётся (см. `24`).

HTML artifact с **3 variants**:

- **Mini-card variant** — только ~30% screen, остальное map видно для context
- **Tab-based variant** — «Магазин / Маршрут / Корзина» в одном popup'е (объединение store info + route ETA + add-to-cart shortcut)
- **Action-first variant** — «Построить маршрут» как primary sticky кнопка на top, store info collapsed

### 5. 🎨 Wow-moment splash для demo

Splash-screen / loading state / pin drop animation / эффект при тапе на красную cell. 1-2 секунды «wow» на демо руководителю Аквафор.

HTML artifact с micro-interaction (CSS animation + minimal JS если нужно). Должно быть mobile-first (animation работает на touch, не только hover).

### 6. 🎨 Color palette swatches (OKLCH)

Visual palette как один artifact-swatch:

- 4-level severity (current: green/yellow/orange/red)
- 5 aquifer layers (brown/green/cyan/blue/purple — см. `21-mobile-drilling-depth-map.png`)
- 2 availability states (store open/closed/partial)
- Brand water-drop

Если найдёшь конфликт severity-green vs aquifer-green (оба видны вместе при включённых обоих слоях) — предложи **OKLCH refresh** с обоснованием.
**Не меняй semantic intent** (red = unsafe, green = safe).

---

## Дополнительно (text-only, приоритет ниже но welcome)

7. 📝 **Visual review per scenario** — пройди **сначала по 11 mobile-скринам** (02, 07, 16-24), потом desktop (01, 03-15) кратко. Для каждого:
    - 3-5 bullet «работает»
    - 3-5 bullet «улучшить»
    - Mark scenarios где сделал artifact'ы выше («см. mockup #1 для альтернатив»)

8. 📝 **Information architecture proposal** — описание + mermaid если хочешь user flow / navigation tree. **Mobile-first** — сколько tap'ов до основных задач: «Что у меня в воде?» / «Какой фильтр?» / «Где ближайший магазин?» / «Какая глубина бурения?»

9. 📝 **Accessibility audit** — touch targets (44×44px минимум), contrast ratios (особенно severity-green vs aquifer-green, severity-yellow vs map basemap), focus management в bottom-sheet, dvh vs vh для iOS Safari.

---

## Формат artifact'ов

- **HTML + Tailwind** (CDN OK для preview, daisyui не обязательна — мы сами адаптируем)
- **Self-contained** — один artifact = один scenario, можно drag в codebase
- **Mobile-first ОБЯЗАТЕЛЬНО** — `<meta viewport>` + 390px width container + touch-friendly targets
- **Comments в HTML** — где какая variant, как читать, какие trade-offs
- **Без lorem ipsum** — реальные данные с скринов: Кашира, ФМ Курс Ступино 25 мин, нитриты, скважина 86м risk 100/100, marганец 0.83 мг/л, etc.
- **Pure HTML, без React** — component'ы я сам адаптирую под Next.js + FSD
- **Touch interactions** через `:active` / `touch-action` где уместно

---

## Stack constraints (НЕ трогать)

- Next.js 16 + maplibre-gl 5.20 + daisyui + TanStack Query
- Без vendor map providers (Mapbox/Google) — только OSM tiles через CARTO/CartoDB
- Без translation (RU-only)
- OKLCH palette
- Backend контракты fixed (см. markdown секцию «Архитектура»)
- Не предлагать **удалять** фичи (можно reorganize, нельзя remove)

---

## Workflow

Начинай **СРАЗУ с artifact'ов**, не с текста:

1. **Artifact #1** (Mobile FTUX 3 variants) — на основе `02-mobile-default-risk.png`
2. **Artifact #2** (BottomSheet IA) — на основе `18-mobile-bottom-sheet-layers.png`
3. **Artifact #3** (PointPopup) — на основе `22-mobile-point-popup.png`
4. **Artifact #4** (StorePopup) — на основе `23-mobile-store-popup.png` + `24-mobile-route-polyline.png`
5. **Artifact #5** (Wow-moment)
6. **Artifact #6** (OKLCH palette)

После каждого artifact'а — краткий review текстом (3-5 bullets «что улучшено» + «trade-offs»).

После 6 обязательных artifact'ов — text-only sections (review per scenario + IA + accessibility).
