import type { TAquiferLayerCount, TIntakeType } from './t-aquifer-layer';

export type TDepthCellProperties = {
    count: number;
    median: number;
    p25: number;
    p75: number;
    minDepth: number;
    maxDepth: number;
    aquiferLayers: TAquiferLayerCount[];
    /** id наиболее представленного горизонта в ячейке. */
    dominantLayerId: string;
    pctWell: number;
};

export type TDepthCellFeature = {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: TDepthCellProperties;
};

export type TDepthMapResponse = {
    type: 'FeatureCollection';
    features: TDepthCellFeature[];
    intakeType: TIntakeType;
    grid: number;
    timeTakenMs: number;
    cached: boolean;
};
