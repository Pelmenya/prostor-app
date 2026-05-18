# Prompt для claude.ai design — smart-search design uplift 2026-05-18

> Copy-paste этот текст в **новый chat** на claude.ai/design (НЕ продолжение прошлых review!).
> Прикрепи: `smart-search-design-uplift-2026-05-18.md` + папку `screenshots/smart-search-design-uplift-2026-05-18/` (**6 PNG**: 3 mobile + 3 desktop текущего live state).

---

Привет! Это **третий заход** на review карты `/water` в PROSTOR — водо-aware приложение Аквафор-Pro.

**Контекст:** smart-search — multi-modal поиск (текст + фото) по каталогу через RAG. Backend готов и работает live (`POST /catalog/search`, ~500ms response, реальные MoySklad results). Phase 1 frontend закрыт (Heroicons вместо emoji, modal `lg:max-w-5xl`, 2×2 grid cards на desktop, category tag, description subtitle, «Найти» CTA hidden в results).

⚠️ В прошлый раз (2026-05-15) ты выдал prototype `PROSTOR Smart Search.html` с 6 sections (idle/loading/results + bbox overlay + desktop split-pane + capля-sparkle branding). Мы реализовали **базу**, но получился **slightly flat / простенький** для центральной фичи `/water`.

⚠️ Прошу **НЕ редизайн**, а **polish-итерацию**: визуальная иерархия + depth (subtle gradients/shadows) + meaningful glyphs + AI-vibe для центрального элемента. И **точечные фиксы на 6 pain points** (см. attached `smart-search-design-uplift-2026-05-18.md`).

---

## ⚠️ ГЛАВНОЕ: HTML/CSS MOCKUPS В ARTIFACT'АХ

Мне нужны **рендеримые HTML/CSS artifact'ы**, не review текстом. Как в прошлый раз — каждый artifact self-contained HTML, можно drag в codebase.

**3 обязательных artifact'а** (каждый mobile 390 + desktop 1280 в одном HTML side-by-side):

### 1. 🎨 Smart-search overlay — wow-вариант (central pain)

Текущий state: `02-mobile-overlay-idle.png` + `03-mobile-overlay-results.png` (mobile bottom-sheet) + `06-desktop-overlay-results.png` (desktop modal).

Что хочу:

- **Hero AI-treatment** в header — large WaterDrop+sparkle на subtle gradient, не tiny badge
- **Background** — мягкий water-gradient или sublime AI-glow, не plain white
- **Chips** — brand-coherent, soft shadow on hover, gradient hint на active state; **унифицировать иконки** (сейчас WaterDrop в «Проблема с водой» filled-bold среди Heroicons stroke — mismatch)
- **Cards** — relevance score visually prominent (large number или meter), AI vibe не «e-commerce listing»
- **Vision badge** mobile-fit — компактный «AI распознал: обратный осмос · 91%» когда `vision !== null`
- **Desktop**: когда `vision !== null` → left sidebar 280px (photo thumb + category + confidence + «Уточнить»); когда text-only → wide grid без sidebar
- **Primary CTA «В корзину» visually dominant**, «Подробнее» secondary ghost

### 2. 🎨 LayerPanel radio — Сплайн/Точки/Оба 3-icon set

Текущий state: `04-mobile-layerpanel-radio.png` — Unicode `✨ Сплайн / ● Точки / ⊙ Оба`. Visual inconsistency (разные шрифты iOS/Android), confusing semantic (sparkles ≠ heatmap blob).

Нужны **3 SVG glyphs** в едином stroke-style (как Heroicons):

- **Сплайн** — smooth blob / cloud / gradient heatmap representation
- **Точки** — scattered dots cluster (5-7 dots)
- **Оба** — layered icon (cloud behind + dots foreground)

Active state — primary fill + outline; inactive — base-content/40 stroke. **Размеры 16/20/24px** (component renders по контексту).

### 3. 🎨 Map layout — right-side controls group + AutoEquipmentCard polish

Текущий state: `01-mobile-idle.png` + `05-desktop-idle.png`.

Проблемы:

- На mobile 3 stacked cards top (`PROSTOR + burger / "15 504 анализа" + Слои / SmartSearchInput`) — SmartSearchInput **визуально равна остальным**, не дает hierarchy «central feature»
- На desktop right-side controls (Слои + Zoom + Легенда + FAB «Прогноз») — **4 разрозненных плейта**
- AutoEquipmentCard «8 По вашему адресу» — wide banner перекрывает heatmap центр

Что хочу:

- **Visual hierarchy header**: header bar compact (PROSTOR + burger) → подзаголовок «15 504 анализа» **inline в левом-top corner map** (не отдельная card) → SmartSearchInput **prominent centered** (subtle gradient border / sparkle accent) — entry-point центральной фичи feels central
- **Right-side toolbar** desktop — group все map controls (Слои + Zoom + FAB Прогноз) в одну `bg-base-100/95 backdrop-blur` vertical panel rounded-2xl shadow-md. Apple Maps-style. Легенда «Уровни» — toggleable popover при hover на Слои, не permanent card
- **AutoEquipmentCard**: `lg:max-w-md` + position bottom-right на desktop (освобождает heatmap viewport), mobile — оставить bottom но slimmer

---

## Дополнительно (text-only ответ welcome)

4. 📝 **Hashtag icon для «По артикулу»** — сейчас Heroicons `#` (HashtagIcon). Семантически читается как тег, не штрих-код. Альтернативы: `QrCodeIcon` / `Bars3BottomLeftIcon` (более barcode-like) / создать собственный barcode SVG. Что лучше для UX?

5. 📝 **Category tag formatting** — `categoryPath.split('/').at(-1)` даёт «ОБРАТНЫЙ ОСМОС < 15000» (часть `< 15000` — ценовой диапазон в MoySklad-категории). Strip regex или брать предпоследний segment если последний содержит цифры?

6. 📝 **AutoEquipmentCard «8 По вашему адресу» vs SmartSearchOverlay** — оба показывают product cards (water-context vs free-search). Должны ли merge'аться в один modal или остаться раздельно? Mermaid flow welcome.

---

## Design system inherited (НЕ менять)

- **OKLCH palette** — severity 4 уровня (safe / borderline / concerning / unsafe) + aquifer 5 горизонтов + brand-primary
- **WaterDrop+sparkle brand-marker** — OKLCH gradient `oklch(72% 0.16 232) → oklch(58% 0.22 250) → oklch(48% 0.26 270)` + sparkle (звёзда правый-верхний)
- **BottomSheetModal pattern** mobile — drag handle (`w-12 h-1`) + swipe-down dismiss + iOS body scroll lock
- **Glass-style controls** — `bg-base-100/95 backdrop-blur shadow-md rounded-xl`
- **Recommendation-card shape** — image + category tag (uppercase) + name + description (2-line clamp) + matchScore badge + price ₽ + split actions
- **Cold-load splash «мультик»** — это якорь эстетики, **не трогать**, использовать как референс уровня polish которого хочется достичь во всей фиче

---

## Backend Phase 1 contract — что доступно

```jsonc
POST /catalog/search → 200 OK

{
    "count": 4,
    "timeTakenMs": 493,
    "docs": [
        {
            "id": "chunk-...",
            "metadata": {
                "externalId": "moysklad-uuid",
                "name": "Аквафор DWM-101S",
                "description": "Обратносмотическая система повышенной производительности...",
                "categoryPath": "Очистка воды/Аквафор/Фильтры с краном/Обратносмотические системы < 15000",
                "salePriceKopecks": 1290000
            },
            "imageUrls": ["https://signed-minio-url"],
            "matchScore": 95  // 0..100
        }
    ],
    "vision": {  // null когда image не передан
        "category": "обратный осмос",
        "description": "Компактная система под мойку, белый корпус, 4 колбы",
        "confidence": "high"  // 'low' | 'mid' | 'high'
    }
}
```

- `vision: null` для text-only search
- `vision.confidence === 'low'` → UX-prompt «Не уверен что распознал. Может опишите словами?»
- Image upload до 5 фото (base64 array, ≤5MB each, JPEG/PNG/WebP)
- Throttle 10/min/IPv6-/64

---

## Acceptance — что жду в финале

- [ ] 3 HTML/CSS artifact'а (overlay polish / 3-icon radio set / map controls group)
- [ ] Mobile 390 + Desktop 1280 в каждом
- [ ] Inherited design system honored (OKLCH / WaterDrop / glass / BottomSheet)
- [ ] Backend Phase 1 contract honored (vision shape, matchScore, image upload, throttle)
- [ ] Brief commentary per artifact: что меняется vs текущим live state + почему

После твоих artifact'ов prostor-claude применит изменения в `feature/water-pivot` branch, прогонит Playwright sweep, я в slovo-claude скрою review. Loop как обычно.

---

## Что НЕ нужно

- ❌ Bbox image overlay annotated — Phase 1.5 (Vision-describer extension)
- ❌ Voice input — Phase 2 (Web Speech API)
- ❌ Bundled services «Монтаж 2 500 ₽» chips — Phase 1.5 (MoySklad service-products mapping)
- ❌ Facet filters Тип/Производитель/Цена — Phase 2 (backend `/catalog/search?filters=...`)
- ❌ Follow-up dialogue — Phase 2 (conversational state)
- ❌ Полный редизайн — нужен **polish**, не starts-over
