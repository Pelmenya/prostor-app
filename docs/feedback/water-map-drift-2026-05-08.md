# Water-map drift от прототипа — 2026-05-08

> **Источник фидбэка:** живая ревизия `/water` на `localhost:3050` от соседнего агента (Claude в slovo). Текущий скрин — `screenshots/water-current-2026-05-08-mobile-390.png` (mobile 390×844).
> **Ссылка на спеку:** `slovo/docs/management/water-map-design-prompt.md` (handoff promt v2, 555 строк)
> **Ссылка на прототип:** `slovo/prostor-heatmap-mobile-standalone.html` (Pencil bundler, mobile-first 3 viewport)
> **Срочность:** до демо руководителю Аквафор. Не блокирует другие фичи, но визуально не соответствует pitch'у.

---

## Что выглядит странно сейчас

См. `screenshots/water-current-2026-05-08-mobile-390.png`.

| Симптом                                                                 | Корень                                                                                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Огромный оранжевый круг по центру Москвы**, мелкие кружки на окраинах | `circle-radius` scale to `count` в cell → центр Москвы имеет много анализов, кажется «грязным» из-за плотности данных, а не качества воды                          |
| **Точечные кружки разного размера вразброс**                            | Используется `maplibre` `circle` layer вместо **`heatmap` layer** с gradient blending. Прототип имел плавное gradient cloud                                        |
| **Нет легенды цвета**                                                   | 4-level severity (`safe` / `borderline` / `concerning` / `unsafe`) не объяснён пользователю                                                                        |
| **Нет pills для смены параметра**                                       | По handoff promt v2 должны быть toggle-pills сверху карты: `Жёсткость / Железо / Марганец / TDS / Risk`                                                            |
| **Нет bottom-sheet с layer-toggles**                                    | Главный элемент управления слоями из прототипа отсутствует. Только FAB справа-внизу и иконка слоёв в правом-верх углу карты — не открывают полную панель toggle'ей |
| **Empty state на карте**                                                | После загрузки сразу `param=risk` без onboarding — пользователь не понимает что куда тыкать                                                                        |

---

## Корень №1 — circle layer вместо heatmap layer

**Что в коде сейчас (примерно):**

```ts
map.addLayer({
    id: 'water-quality',
    type: 'circle',
    source: 'water-quality-source',
    paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 4, 50, 30],
        'circle-color': /* по severity */,
        'circle-opacity': 0.7,
    },
});
```

**Что должно быть** (по прототипу `prostor-heatmap-mobile-standalone.html`):

```ts
map.addLayer({
    id: 'water-quality-heatmap',
    type: 'heatmap',
    source: 'water-quality-source',
    paint: {
        // Вес каждой точки = exceedsPct (0..100). Если в cell всё в норме — вес 0,
        // если все 100% превышают — вес 1. Это гарантирует что ХУДШИЕ зоны
        // выглядят интенсивнее, не самые ПЛОТНЫЕ.
        'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'exceedsPct'], 0],
            0,
            0,
            100,
            1,
        ],
        // Зум-зависимая интенсивность — на дальнем zoom heatmap почти прозрачный,
        // на ближнем плотный.
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 1.5],
        // 4-level severity палитра (safe → borderline → concerning → unsafe).
        // Прозрачность снизу — пустые зоны не покрашиваются.
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 0, 0, 0)',
            0.2,
            'rgba(34, 197, 94, 0.30)', // safe — green-500
            0.5,
            'rgba(234, 179, 8, 0.55)', // borderline — yellow-500
            0.7,
            'rgba(249, 115, 22, 0.75)', // concerning — orange-500
            1.0,
            'rgba(239, 68, 68, 0.90)', // unsafe — red-500
        ],
        // Радиус blob'а в пикселях — растёт с zoom.
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 14, 10, 28, 12, 40],
        'heatmap-opacity': 0.85,
    },
});
```

**Ключевая разница:** `heatmap-weight` берётся из `exceedsPct` (что % превышает ПДК), не из `count`. Это решает «Москва = огромный оранжевый» — теперь Москва будет красной только если реально вода плохая, а не если просто много анализов.

Когда `zoom > 11` — переключиться на индивидуальные точки через `circle` layer + `/water-analysis/points` endpoint (high-zoom детализация).

---

## Корень №2 — нет param-pills

**Где в прототипе:** компактная горизонтально-прокручиваемая полоска под header'ом, перед картой:

```
[ Risk ] [ Жёсткость ] [ Железо ] [ Марганец ] [ TDS ]
```

Active pill — filled gradient. Inactive — outline. На тап меняется `useState<THeatmapParam>` → перезапрос `/water-analysis/heatmap?param={selected}` через TanStack Query (cache key включает param).

**Где разместить в коде:** в `views/water-map/water-map-page.tsx`, прямо над maplibre-контейнером. Используй `daisyui` button или твой shared-ui.

---

## Корень №3 — нет легенды

В правом-нижнем углу карты или над ней — компактная карточка:

```
┌─────────────────────┐
│ 🟢 Норма    🟡 На границе │
│ 🟠 Возможно проблема     │
│ 🔴 Превышение ПДК        │
└─────────────────────┘
```

Размер ~140×80px, semi-transparent background, абсолютно позиционирована поверх карты. На клике — collapse в маленькую иконку.

---

## Корень №4 — нет bottom-sheet с layer-toggles

По handoff promt v2 (Phase 4.5 чеклист):

```
- [ ] Top-bar с layer-icon (по прототипу `prostor-heatmap-mobile-standalone.html`)
- [ ] Bottom-sheet с layer-toggles (default OFF):
  - [ ] Качество воды в районе (heatmap по 5 параметрам)
  - [ ] Похожие анализы рядом (radius circle от пина клиента)
  - [ ] Глубина скважин и колодцев (depth-map + bar chart горизонтов внизу карты)
  - [ ] 3D-режим скважин/колодцев (extruded columns: высота = mean depth, цвет = aquifer layer)
  - [ ] Аномалии (anomaly markers)
```

UX:

- Layer-icon сейчас **есть** в правом-верх углу карты ✅ — но при тапе не открывает sheet.
- На тап → `bottom-sheet` (mobile) / `side-drawer` (iPad) / `sidebar` (desktop) с 5 toggle-rows + sub-controls.
- Default — heatmap включён, остальные выключены.

---

## Корень №5 — empty state без guidance

Сейчас на mobile есть **подсказка** «Поставь пин на свой адрес» внизу карты — это хорошо, но:

- Кнопка «Использовать геолокацию» — синяя ссылка, не выглядит как primary action. Сделай её primary button (gradient + капля-иконка слева).
- После пина клиента — должно появиться **radius-кольцо вокруг пина** (зелёное полупрозрачное) + автоматический запрос `/equipment-suggest` с уведомлением «По вашему адресу: 2 проблемы → 5 рекомендаций» как floating card.

---

## Acceptance после правок

1. На mobile 390×844 загружается `/water` → видишь МО bbox с **gradient heatmap** (плавное облако), не точечные кружки.
2. Сверху карты — 5 pills для смены параметра.
3. В углу — легенда 4-level severity.
4. Тап на layer-icon → bottom-sheet с 5 toggles.
5. Тап на «Использовать геолокацию» → пин клиента + зелёный radius circle 5км + auto-fetch `/equipment-suggest`.
6. Zoom > 11 → переключение на individual points (`/water-analysis/points`).
7. На iPad/desktop — bottom-sheet превращается в side-drawer / sidebar.

---

## Что не нужно править

- Header «PROSTOR» + burger menu — ✅ ОК как есть.
- Карточка «Карта качества воды · 15 504 анализа» — ✅ хорошо, оставить.
- Bottom-nav «Каталог · Вода · Корзина» — ✅ ровно по дизайну Phase 3.
- API integration — ✅ запросы идут правильно (`param=risk&west=...&south=...&east=...&north=...&grid=0.05`), ответ парсится. Только визуальный rendering нужно поменять.

---

## Полезные ссылки

- `slovo/docs/management/water-map-design-prompt.md` — полный handoff promt v2 (sample responses 7 endpoints, FSD-структура, severity colors)
- `slovo/prostor-heatmap-mobile-standalone.html` — оригинальный прототип (Pencil bundler) — открой в браузере для сравнения
- `slovo/PROSTOR-Smart-Search.html` — оригинальный design-mockup откуда брали SVG капли (Phase 2)
- `slovo/docs/features/prostor-water-pivot.md` — план фичи целиком (Phase 1-6 + acceptance)

---

## Если что-то непонятно

Спроси у разработчика напрямую — чем точнее вопрос, тем быстрее ответ. Не угадывай — лучше ask than break further.
