/**
 * 22 канонических paramCode из СанПиН 1.2.3685-21 + synthetic `risk` (0-100).
 *
 * Источник: `slovo/apps/api/src/modules/water-analysis/water-analysis.constants.ts`
 * (HEATMAP_PARAMS literal). Дублируем здесь чтобы:
 *   - не тащить @slovo/* в prostor-app dependencies;
 *   - получить string-literal union для type-safety при switch/maps в UI.
 */
export const WATER_PARAMS = [
    'odor',
    'color',
    'turbidity',
    'tds',
    'hardness_total',
    'permanganate_oxidizability',
    'ph',
    'ammonium',
    'iron_total',
    'manganese',
    'magnesium',
    'calcium',
    'nitrates',
    'nitrites',
    'sulfates',
    'sulfides',
    'chlorides',
    'fluorides',
    'hydrogen_sulfide',
    'alkalinity_total',
    'temperature',
    'electrical_conductivity',
    'risk',
    // Synthetic composite — backend OR-aggregation по всем 19 regulated params
    // (commit 0d9d786 в slovo). Per cell exceedsPct = % rows где хотя бы один
    // param > ПДК. Status thresholds: <30% good, 30-60% mid, ≥60% bad.
    'all_problems',
    // Density-режим (commit 1bd6d69 в slovo). Не severity, а dataset coverage —
    // сколько анализов в cell. Используется как ОТДЕЛЬНЫЙ layer-toggle, не
    // pill (другая семантика). status по count: <5 good, 5-15 mid, ≥15 bad.
    'coverage',
] as const;

export type TWaterParam = (typeof WATER_PARAMS)[number];

/**
 * Топ-6 параметров для UI pills heatmap. Два composite synthetic'a сверху
 * (Risk + Все проблемы) — закрывают 80% юзеров за один тап. Остальные 4 —
 * самые узнаваемые/проблемные индивидуальные параметры МО.
 */
export const FEATURED_HEATMAP_PARAMS: ReadonlyArray<TWaterParam> = [
    'risk',
    'all_problems',
    'iron_total',
    'hardness_total',
    'manganese',
    'tds',
];
