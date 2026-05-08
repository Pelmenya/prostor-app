import type {
    TAquiferStatsResponse,
    TBbox,
    TDepthMapResponse,
    TDepthPredictResponse,
    TEquipmentSuggestResponse,
    THeatmapCellDetail,
    THeatmapResponse,
    TIntakeType,
    TPointsResponse,
    TPredictResponse,
    TWaterParam,
} from '@/entities/water-analysis';
import { slovoGet, slovoPost } from './slovo-api-client';

/**
 * Typed API-обёртки для 7 endpoint'ов slovo water-analysis. Используются
 * в TanStack Query хуках (см. water-analysis.queries.ts) — здесь только raw
 * fetch + типизация ответа.
 */

export type THeatmapQuery = TBbox & {
    param: TWaterParam | string;
    grid?: number;
};

export function fetchHeatmap(q: THeatmapQuery, signal?: AbortSignal): Promise<THeatmapResponse> {
    return slovoGet<THeatmapResponse>(
        '/water-analysis/heatmap',
        {
            param: q.param,
            west: q.west,
            south: q.south,
            east: q.east,
            north: q.north,
            grid: q.grid,
        },
        signal,
    );
}

export type TPredictQuery = {
    lat: number;
    lon: number;
    k?: number;
    radiusKm?: number;
};

export function fetchPredict(q: TPredictQuery, signal?: AbortSignal): Promise<TPredictResponse> {
    return slovoGet<TPredictResponse>('/water-analysis/predict', q, signal);
}

export type TDepthMapQuery = TBbox & {
    intakeType?: TIntakeType;
    grid?: number;
};

export function fetchDepthMap(q: TDepthMapQuery, signal?: AbortSignal): Promise<TDepthMapResponse> {
    return slovoGet<TDepthMapResponse>(
        '/water-analysis/depth-map',
        {
            west: q.west,
            south: q.south,
            east: q.east,
            north: q.north,
            intakeType: q.intakeType,
            grid: q.grid,
        },
        signal,
    );
}

export type TDepthPredictQuery = {
    lat: number;
    lon: number;
    intakeType?: TIntakeType;
    k?: number;
    radiusKm?: number;
};

export function fetchDepthPredict(
    q: TDepthPredictQuery,
    signal?: AbortSignal,
): Promise<TDepthPredictResponse> {
    return slovoGet<TDepthPredictResponse>('/water-analysis/depth-predict', q, signal);
}

export type TPointsQuery = TBbox & {
    limit?: number;
};

export function fetchPoints(q: TPointsQuery, signal?: AbortSignal): Promise<TPointsResponse> {
    return slovoGet<TPointsResponse>('/water-analysis/points', q, signal);
}

export type TEquipmentSuggestBody = {
    lat: number;
    lon: number;
    topK?: number;
};

export function postEquipmentSuggest(
    body: TEquipmentSuggestBody,
    signal?: AbortSignal,
): Promise<TEquipmentSuggestResponse> {
    return slovoPost<TEquipmentSuggestResponse>('/water-analysis/equipment-suggest', body, signal);
}

export type TAquiferStatsQuery = TBbox & {
    intakeType?: TIntakeType;
};

export function fetchAquiferStats(
    q: TAquiferStatsQuery,
    signal?: AbortSignal,
): Promise<TAquiferStatsResponse> {
    return slovoGet<TAquiferStatsResponse>('/water-analysis/aquifer-stats', q, signal);
}

export type THeatmapCellQuery = {
    lat: number;
    lon: number;
    grid: number;
};

export function postHeatmapCellDetail(
    q: THeatmapCellQuery,
    signal?: AbortSignal,
): Promise<THeatmapCellDetail> {
    return slovoPost<THeatmapCellDetail>('/water-analysis/heatmap/cell', q, signal);
}
