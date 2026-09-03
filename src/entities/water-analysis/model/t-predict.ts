import type { TPdkStatus } from './t-pdk-status';

/**
 * Один interval-уровень. Confidence = 80 (P10-P90), 50 (IQR), 100 (hardRange).
 */
export type TParamInterval = {
    lower: number;
    upper: number;
    confidence: number;
};

/**
 * Прогноз одного параметра (interval-валюированный, см. predict.response.dto).
 */
export type TPredictParamEstimate = {
    interval: TParamInterval;
    iqr: TParamInterval;
    hardRange: TParamInterval;
    pointEstimate: number;
    n: number;
    pdkStatus: TPdkStatus | null;
};

/**
 * UI shortcut для рендера секций без iteration по 22 paramCode.
 */
export type TPredictByCategory = {
    unsafe: string[];
    concerning: string[];
    borderline: string[];
    safe: string[];
    unmonitored: string[];
};

export type TPredictResponse = {
    predicted: Record<string, TPredictParamEstimate>;
    byCategory: TPredictByCategory;
    nNeighbors: number;
    medianDistKm: number;
    radiusKm: number;
    mostLikelyAquiferLayer?: string;
    insufficientData: boolean;
    timeTakenMs: number;
    cached: boolean;
};
