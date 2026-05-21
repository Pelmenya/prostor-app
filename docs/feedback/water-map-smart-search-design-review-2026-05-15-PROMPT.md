# Prompt для claude.ai design — smart-search integration 2026-05-15

> Copy-paste этот текст в **новый chat** на claude.ai/design (не продолжение прошлого review!).
> Прикрепи: `water-map-smart-search-design-review-2026-05-15.md` + папку `screenshots/sweep-2026-05-15/` (**8 PNG**: 7 current state + smart-search-early-prototype).

---

Привет! Это **продолжение** review карты `/water` в PROSTOR — водо-aware приложение Аквафор-Pro.

В прошлом review (2026-05-14) ты выдал 6 mockup'ов которые мы применили полностью: OKLCH palette + PointPopup proposed + FTUX V-C + StorePopup + BottomSheet sticky-pills + pin-animation + cold-load splash + equipment-suggest v5 + glass-FAB. **Финальное состояние на 7 скринах** `sweep-01..07-*.png`.

Сейчас открываем **новую фичу** — **«Умный поиск»** (smart-search) — multi-modal (текст + фото) поиск по каталогу через RAG (vision-augmented embedding search). Backend готов: `POST /catalog/search` reuses тот же recommendation-card shape что в EquipmentModal v5.

⚠️ **У меня уже есть early prototype** от тебя же — `smart-search-early-prototype.png`. Там 3 mobile states (idle/loading/results) + branding direction «капля + sparkle». Используй как **starting direction** — доработай в полноценную интеграцию.

---

## ⚠️ ГЛАВНОЕ: HTML/CSS MOCKUPS В ARTIFACT'АХ

Мне нужны **рендеримые HTML/CSS artifact'ы**, не только review текстом. Как в прошлый раз — каждый artifact = self-contained HTML, можно drag в codebase.

**5 обязательных artifact'ов** — каждый mobile 390 + desktop 1280 в одном HTML (side-by-side через flex):

### 1. 🎨 Точка входа (Entry-point)

Где в /water юзер открывает smart-search? Сейчас 4 entry-point'a на карте: hamburger menu, FAB «Слои» (right-top), zoom +/− (right-middle), SimilarFab «Прогноз» (right-bottom). Куда логично положить smart-search? Header search-icon? Дополнительный FAB right-side? Bottom-sheet section?

HTML artifact с **2-3 variants** размещения + краткий trade-off каждый.

### 2. 🎨 Idle state (стартовый)

Search input + chip-suggestions + быстрые сценарии. На основе твоего prototype, но с уточнениями:

- Mobile: bottom-sheet (как BottomSheetModal pattern) или full-screen?
- Desktop: где живёт — sidebar / modal / inline header?
- Multi-modal сразу: text input + camera-icon + (optional) voice-icon
- Chip-suggestions: 4-6 типичных запросов («жёсткая вода», «запах», «ржавчина», «фильтр для дачи», «для скважины 50м»)
- Быстрые сценарии preset (как «Калибровка для DMM 105» в твоём prototype) — что это и нужны ли они в Phase 1?

### 3. 🎨 Loading state

Visible AI progress — НЕ black-box spinner. Steps:

1. «Анализируем фото...» (если photo загружено)
2. «Подбираем товары из 155 в каталоге...»
3. «Готовим рекомендации...»

С animated icons / progress lines. Reduced-motion fallback — fade-in steps без animation.

### 4. 🎨 Results state

AI-badge с vision description + product cards. **Reuse recommendation-card design** из `sweep-03-mobile-equipment-modal.png` — у нас уже есть финальный UI компонент:

- Image (presigned MinIO, real МойСклад photo)
- Name + matchedProblem badge (orange/yellow severity)
- reason text
- Цена «5 990 ₽» formatting
- Split-actions: «Подробнее» (Link) + **«В корзину»** (primary)

Что добавить специально для smart-search:

- **AI-badge сверху списка** с vision description («AI видит на фото: фильтр-кувшин 5л, мутный осадок»)
- Возможно **secondary badge на каждой card** — relevance % или match-reason («совпадает с фотографией» / «по запросу»)
- Empty state — если 0 matches, показать suggestions «попробуйте: ...»

### 5. 🎨 Branding icon — «капля + sparkle»

**Финальный SVG-маркер** для всей фичи. Используется и в:

- FAB entry-point (artifact #1)
- Loading state animated (artifact #3)
- AI-badge в Results state (artifact #4)

Один знак, узнаваемый, brand-coherent (water-drop = PROSTOR brand) + sparkle (AI). НЕ Sparkles only, НЕ Target — именно симбиоз.

Размеры:

- 16px (inline badge)
- 24px (mobile FAB)
- 32px (desktop FAB / loading anim)
- 48px (hero в idle state)

---

## Дополнительно (text-only, приоритет ниже но welcome)

6. 📝 **Mapping в existing flow** — smart-search и EquipmentModal v5 имеют похожий output (recommendation-cards). Когда юзер ставит pin → AutoEquipmentCard → EquipmentModal (water-context). Когда нет pin → smart-search через query. Должны ли они merge'аться в один modal или остаться раздельно? Mermaid диаграмма flow welcome.

7. 📝 **Voice input** — Web Speech API. Это Phase 2 (после text+photo), но мысли welcome.

8. 📝 **A11y** — touch targets 44px, focus management (search input → photo picker → submit), screen-reader announcements AI states.

---

## Design system inherited (НЕ менять)

Применённые decisions из 2026-05-14 review:

- **OKLCH palette** — severity 4 уровня + aquifer 5 горизонтов + brand. Все через daisyui theme tokens (`var(--color-primary)` light/dark theme-aware).
- **Glass-style controls** — все map FAB'ы: `bg-base-100/95 backdrop-blur shadow-md rounded-xl`. White card, icon brand-primary fill.
- **BottomSheetModal pattern** — backdrop-blur + drag handle (`w-12 h-1`) + swipe-down dismiss + iOS body scroll lock + `footer` prop CTA как `shrink-0` sibling
- **FTUX Variant C** — orientation-headline, pin-icon-in-circle, exit-link
- **PointPopup proposed** — hero risk-circle + at-a-glance gradient bar + ×ПДК per param + sticky footer CTA
- **Recommendation-card design** — image + name + matchedProblem badge + reason + цена + split actions «Подробнее» + «В корзину»

---

## Формат artifact'ов

- HTML + Tailwind CDN OK, daisyui НЕ обязательна (мы адаптируем под daisyui themed tokens)
- **Mobile 390 + Desktop 1280 side-by-side** в одном HTML (flex display row, 24px gap)
- Self-contained (один artifact = один файл)
- Real data — Аквафор DMM-105 49 990 ₽, реальные queries («ржавая вода / запах серы»), real photo placeholders «фильтр-кувшин»
- Pure HTML (no React) — мы сами адаптируем компонент под Next.js + FSD

---

## Stack constraints (НЕ трогать)

- Next.js 16 + maplibre-gl 5.20 + daisyui + TanStack Query + Zustand
- Backend готов: `POST /catalog/search` body `{query, topK?, imageBase64?}` → `{count, docs: [{id, pageContent, metadata, imageUrls}], timeTakenMs}`
- Throttle 10/min/IP — **search-on-submit** (Enter/button), не on-typing live search
- Photo через `imageBase64` (base64-encoded), до 5 фото в запросе
- RU-only (no i18n)
- OKLCH palette + daisyui theme-aware
- Reuse existing recommendation-card from EquipmentModal v5 — не изобретать новую

---

## Workflow

Начинай с **artifact #5 (branding icon)** — это foundation для остальных. Финальный SVG используется в #1/#2/#3 как FAB-entry, loading anim, AI-badge.

Затем:

1. **#5** Branding icon
2. **#1** Entry-point (2-3 variants)
3. **#2** Idle state (mobile + desktop)
4. **#3** Loading state (mobile + desktop)
5. **#4** Results state (mobile + desktop, with AI-badge)

После каждого artifact'а — краткий review (3-5 bullets «что улучшено» + «trade-offs»).

После 5 artifact'ов — text-only sections (mapping flow + voice + a11y).
