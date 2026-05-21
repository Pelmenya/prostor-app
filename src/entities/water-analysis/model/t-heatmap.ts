import type { THeatmapCellStatus } from './t-pdk-status';
import type { TWaterParam } from './t-water-param';

export type THeatmapCellProperties = {
    param: TWaterParam | string;
    count: number;
    mean: number;
    median: number;
    p75: number;
    exceedsCount: number;
    exceedsPct: number;
    status: THeatmapCellStatus;
};

export type THeatmapFeature = {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: THeatmapCellProperties;
};

/**
 * GeoJSON FeatureCollection (maplibre-friendly).
 */
export type THeatmapResponse = {
    type: 'FeatureCollection';
    features: THeatmapFeature[];
    param: string;
    pdk: number;
    grid: number;
    timeTakenMs: number;
    cached: boolean;
};
