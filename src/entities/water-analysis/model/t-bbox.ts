/**
 * BBox в WGS84. Используется как query-parameter во всех cell-агрегатных
 * endpoints (heatmap / depth-map / aquifer-stats / points).
 */
export type TBbox = {
    west: number;
    south: number;
    east: number;
    north: number;
};
