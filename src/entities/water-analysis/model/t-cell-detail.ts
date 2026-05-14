/**
 * Один параметр в breakdown'е cell. exceedsPct, max, median + n + ПДК.
 *
 * `pdk` может быть `number` (большинство) или `{min, max}` (только pH).
 */
export type TParamBreakdown = {
    paramCode: string;
    nameRu: string;
    unit: string;
    pdk: number | { min: number; max: number };
    n: number;
    exceedsCount: number;
    exceedsPct: number;
    max: number;
    median: number;
    /**
     * `max / pdk` для single-pdk параметров. `null` для range-pdk (pH).
     * Источник: slovo commit 845526d (handoff 2026-05-14 16:05).
     */
    maxExceedanceRatio: number | null;
    /**
     * `median / pdk` для single-pdk. `null` для range-pdk (pH).
     */
    medianExceedanceRatio: number | null;
};

/**
 * POST /water-analysis/heatmap/cell — детали выбранной cell heatmap'а.
 *
 * `topProblems` — top 5 sorted by exceedsPct desc (только > 0%).
 * `inNormParams` — paramCode'ы где exceedsPct=0 (отсортированы alphabetically).
 * `nTotal` — анализов агрегировано в cell. `nWithExceedance` — сколько rows
 * имеют хотя бы одно превышение (для header summary).
 */
export type THeatmapCellDetail = {
    topProblems: TParamBreakdown[];
    inNormParams: string[];
    nTotal: number;
    nWithExceedance: number;
    earliestSampleDate: string;
    latestSampleDate: string;
    cellLat: number;
    cellLon: number;
    grid: number;
    timeTakenMs: number;
    cached: boolean;
};
