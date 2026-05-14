import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * Severity palette — hex-эквиваленты OKLCH targets из claude design refresh
 * 2026-05-14 (см. `--wm-severity-*` в globals.css). MapLibre 5.x не парсит
 * oklch() в paint expressions — используем hex.
 *
 * Visual consistency между картой и UI бейджами (severity-badge, popup).
 * a11y: aquifer-Песчаный сдвинут с green H150 → khaki H95 чтобы не совпадал
 * с severity-safe для deuteranopia (см. aquifer-layers.ts).
 */
// Откат к Tailwind 500-уровню — насыщенные цвета как в оригинальном варианте.
const GREEN = '#22c55e'; // green-500
const YELLOW = '#eab308'; // yellow-500
const ORANGE = '#f97316'; // orange-500
const RED = '#ef4444'; // red-500

// =============================================================================
// CELLS circle layer paint — главный визуал агрегированных cells.
//
// История: пробовали heatmap layer (density blending) — оказалось не соответствует
// прототипу. Прототип `prostor-heatmap-mobile-standalone.html` показывает россыпь
// мелких разноцветных точек, каждая cell читаемо отдельно. Поэтому circle, но:
//   - radius НЕ от count (это давало «Москва-blob»)
//   - radius zoom-scaled (фиксированный паттерн на любой плотности)
//   - color от exceedsPct (4-5 level severity gradient)
//
// Источник дизайна: docs/feedback/water-map-thread.md (slovo-claude self-correction
// + new-strategy 2026-05-08).
// =============================================================================

/**
 * Радиус cell-точки — фиксированный для zoom level, НЕ от count. На overview
 * мелкие pinpoints (2-3px), на high-zoom крупнее (6-10px) до fade-out на /points.
 *
 * Размер уменьшен относительно standalone варианта потому что dots теперь
 * рисуются ПОВЕРХ heatmap-blobs (predator-style stacked) — точки = pinpoints,
 * heatmap = main visual.
 */
export function cellsCircleRadiusExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        2,
        9,
        3,
        11,
        6,
        13,
        10,
    ] as unknown as ExpressionSpecification;
}

/**
 * Цвет cell-точки по exceedsPct (% анализов превышающих ПДК в cell). 5-level
 * gradient — добавляет lime между green и yellow для smoother переход на
 * mid-range exceedsPct (typical для МО при iron_total/manganese).
 */
export function cellsCircleColorExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'exceedsPct'], 0],
        0,
        '#22c55e', // green-500 — safe
        25,
        '#84cc16', // lime-500 — почти safe
        50,
        '#eab308', // yellow-500 — borderline
        75,
        '#f97316', // orange-500 — concerning
        100,
        '#ef4444', // red-500 — unsafe
    ] as unknown as ExpressionSpecification;
}

/**
 * Stroke на high-zoom — определяет точку на близком масштабе (zoom 11+),
 * особенно поверх heatmap-blob чтобы не сливалось с подложкой.
 */
export function cellsCircleStrokeWidthExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0,
        11,
        1.5,
    ] as unknown as ExpressionSpecification;
}

/**
 * Cell-opacity fade-out при zoom >= 11 — переключаемся на individual `/points`
 * layer (там реальные анализы, не агрегаты). На zoom 13+ cells полностью
 * прозрачные, points полностью visible.
 */
export function cellsCircleOpacityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.85,
        11,
        0.95,
        13,
        0,
    ] as unknown as ExpressionSpecification;
}

// =============================================================================
// HEATMAP layer paint — Predator-style подложка под circle dots.
//
// Two-layer strategy (см. docs/feedback/water-map-thread.md 2026-05-08 19:10):
//   - HEATMAP underneath: smooth gradient blobs (predator vision wow-effect)
//   - DOTS поверх: точные pinpoints (individual cell read'ability)
//
// Палитра — насыщенные 7 stops (от прозрачного к red-600 peak heat).
// Density-stops сжаты к началу (0.05) чтобы низкие плотности уже окрашивались.
// Radius/intensity бóльшие чем в standalone-варианте — heatmap теперь main visual.
// =============================================================================

/**
 * Baseline weight 0.15 для cells с exceedsPct=0 — критично:
 *   - Без baseline cells «всё в норме» имеют weight=0 → invisible heatmap
 *   - Юзер не отличает «нет данных» от «всё в норме» (оба пустые)
 *   - Baseline 0.15 рендерит good cells как green-туман, bad — red peak
 *
 * См. docs/feedback/water-map-thread.md (slovo-claude 2026-05-08 20:15
 * Фикс A). Эффект: на pH/calcium теперь равномерная зелёная подложка
 * по МО, на risk/iron — drama сохраняется (high weights → красный peak).
 */
export function heatmapWeightExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'exceedsPct'], 0],
        0,
        0.15,
        100,
        1.0,
    ] as unknown as ExpressionSpecification;
}

export function heatmapIntensityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        1.0,
        10,
        1.5,
        12,
        2.0,
    ] as unknown as ExpressionSpecification;
}

/**
 * Predator-vision palette — 7 stops, насыщенные цвета. Density-stops
 * сдвинуты к началу (0.02 для green) чтобы baseline-weight 0.15 (good cells)
 * уже попадал в зелёную зону палитры, а не оставался прозрачным. См.
 * Фикс A в docs/feedback/water-map-thread.md 2026-05-08 20:15.
 */
export function heatmapColorExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0, 0, 0, 0)',
        0.02,
        'rgba(34, 197, 94, 0.40)', // green-500 — safe (baseline 0.15 weight попадает сюда)
        0.2,
        'rgba(132, 204, 22, 0.55)', // lime-500
        0.4,
        'rgba(234, 179, 8, 0.70)', // yellow-500
        0.6,
        'rgba(249, 115, 22, 0.82)', // orange-500
        0.8,
        'rgba(239, 68, 68, 0.90)', // red-500
        1.0,
        'rgba(220, 38, 38, 1.0)', // red-600 — peak heat
    ] as unknown as ExpressionSpecification;
}

export function heatmapRadiusExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        25,
        9,
        40,
        11,
        55,
        13,
        70,
    ] as unknown as ExpressionSpecification;
}

/**
 * Heatmap fade-out при high-zoom — на zoom > 11 мы переключаемся на individual
 * points (через /water-analysis/points), агрегированный heatmap уходит.
 * На zoom 11 heatmap всё ещё видна (смешивается с dots), на 13 — полностью fade.
 */
export function heatmapOpacityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.7,
        11,
        0.7,
        13,
        0,
    ] as unknown as ExpressionSpecification;
}

// =============================================================================
// POINTS layer (high-zoom, zoom > 10) — individual анализы.
//
// circle-color по risk-score (synthetic 0-100). Если property отсутствует
// или null — серый fallback. `coalesce` с -1 чтобы избежать crash'а при
// сравнении null с числом (MapLibre `<=` против null = false → попадёт
// в default branch RED, что неверно).
// =============================================================================

export function pointsCircleColorExpression(): ExpressionSpecification {
    return [
        'case',
        ['!', ['has', 'risk']],
        '#9ca3af',
        ['==', ['typeof', ['get', 'risk']], 'null'],
        '#9ca3af',
        ['<=', ['coalesce', ['get', 'risk'], -1], 50],
        GREEN,
        ['<=', ['coalesce', ['get', 'risk'], -1], 80],
        ORANGE,
        RED,
    ] as unknown as ExpressionSpecification;
}

/**
 * Радиус point — sane minimum (4px) на любом видимом zoom, плавный рост
 * до 10px на zoom 16. Без upper extrapolation чтобы dots не разрастались
 * до огромного размера при пожалуйшем zoom-in.
 */
export function pointsCircleRadiusExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        4,
        12,
        6,
        14,
        8,
        16,
        10,
    ] as unknown as ExpressionSpecification;
}

/**
 * Opacity fade-in start на zoom 10 чтобы точки появлялись плавно при
 * переключении с агрегированных cells.
 */
export function pointsCircleOpacityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        0.5,
        11,
        0.85,
        12,
        0.95,
    ] as unknown as ExpressionSpecification;
}

// =============================================================================
// COVERAGE layer paint — density-режим (paramCode='coverage').
//
// Не severity, а dataset density: сколько анализов в cell. Используется как
// ОТДЕЛЬНЫЙ toggle поверх любого heatmap. Grey-scale palette — нейтральный
// слой не конкурирует с severity-цветами.
//
// Backend smoke (МО, 886 cells): max=1817, percentiles ~ <5/5-15/>=15.
// Weight нормируем через clamp 50 чтобы dense Москва-blob не «съедал» весь
// gradient на overview.
// =============================================================================

export function coverageHeatmapWeightExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'count'], 0],
        0,
        0,
        50,
        1.0,
    ] as unknown as ExpressionSpecification;
}

export function coverageHeatmapIntensityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.8,
        10,
        1.2,
        12,
        1.6,
    ] as unknown as ExpressionSpecification;
}

/**
 * Grey-scale palette — light/medium/dark grey. Density-stops аналогичны
 * heatmap predator (0.02/0.20/0.45/0.70/1.0) для smooth gradient.
 */
export function coverageHeatmapColorExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0, 0, 0, 0)',
        0.02,
        'rgba(156, 163, 175, 0.30)', // gray-400 (light)
        0.25,
        'rgba(107, 114, 128, 0.50)', // gray-500
        0.5,
        'rgba(75, 85, 99, 0.70)', // gray-600 (medium)
        0.8,
        'rgba(55, 65, 81, 0.85)', // gray-700
        1.0,
        'rgba(31, 41, 55, 0.95)', // gray-800 (dark)
    ] as unknown as ExpressionSpecification;
}

export function coverageHeatmapRadiusExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        20,
        9,
        32,
        11,
        45,
        13,
        60,
    ] as unknown as ExpressionSpecification;
}

export function coverageHeatmapOpacityExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.55,
        11,
        0.55,
        13,
        0,
    ] as unknown as ExpressionSpecification;
}

// =============================================================================
// DEPTH-MAP circle layer — drilling USP-4 (бурильщики/копатели/гидрогеологи).
//
// Color по `dominantLayerId` (5 aquifer типов) через `aquiferMatchExpression`.
// Radius по count агрегатов глубин — больше скважин в cell = плотнее точка.
// Opacity static (drilling-юзер хочет видеть точки чётко на любом zoom).
// =============================================================================

export function depthMapCircleRadiusExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        4,
        9,
        7,
        11,
        11,
        13,
        16,
    ] as unknown as ExpressionSpecification;
}

export function depthMapCircleStrokeWidthExpression(): ExpressionSpecification {
    return [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.5,
        11,
        1.5,
    ] as unknown as ExpressionSpecification;
}

export const HEATMAP_PALETTE = {
    safe: GREEN,
    borderline: YELLOW,
    concerning: ORANGE,
    unsafe: RED,
};
