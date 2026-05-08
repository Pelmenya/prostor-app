/**
 * 5 водоносных горизонтов МО (эмпирические границы). Источник:
 * `slovo/apps/api/src/modules/water-analysis/water-analysis.constants.ts`
 * (AQUIFER_LAYERS).
 */
export type TAquiferLayerId = 'top_water' | 'sandy' | 'sandy_limestone' | 'limestone' | 'artesian';

export type TAquiferLayer = {
    id: TAquiferLayerId;
    /** Min depth включительно (м). */
    minDepth: number;
    /** Max depth исключительно (м). Для artesian — null (200m+). */
    maxDepth: number | null;
    /** UI label «диапазон / русское название». */
    label: string;
};

/**
 * intakeType filter для drilling-endpoints (depth-map / depth-predict / aquifer-stats).
 */
export type TIntakeType = 'all' | 'well' | 'well_dug';

/**
 * Один bucket в layer-distribution (depth-map cells, depth-predict, aquifer-stats).
 */
export type TAquiferLayerCount = {
    id: TAquiferLayerId | string;
    label: string;
    count: number;
    pct: number;
};
