import type { TAquiferLayerCount, TIntakeType } from './t-aquifer-layer';

export type TDepthInterval = {
    lower: number;
    upper: number;
    confidence: number;
};

export type TDepthEstimate = {
    interval: TDepthInterval;
    iqr: TDepthInterval;
    hardRange: TDepthInterval;
    pointEstimate: number;
    n: number;
};

export type TDepthPredictResponse = {
    predicted: TDepthEstimate | null;
    mostLikelyAquiferLayer?: string;
    layerDistribution: TAquiferLayerCount[];
    nNeighbors: number;
    medianDistKm: number;
    intakeType: TIntakeType;
    radiusKm: number;
    insufficientData: boolean;
    timeTakenMs: number;
    cached: boolean;
};
