'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type {
    TAquiferStatsResponse,
    TDepthMapResponse,
    TDepthPredictResponse,
    TEquipmentSuggestResponse,
    THeatmapCellDetail,
    THeatmapResponse,
    TPointsResponse,
    TPredictResponse,
} from '@/entities/water-analysis';
import {
    fetchAquiferStats,
    fetchDepthMap,
    fetchDepthPredict,
    fetchHeatmap,
    fetchPoints,
    fetchPredict,
    postEquipmentSuggest,
    postHeatmapCellDetail,
    type TAquiferStatsQuery,
    type TDepthMapQuery,
    type TDepthPredictQuery,
    type TEquipmentSuggestBody,
    type THeatmapCellQuery,
    type THeatmapQuery,
    type TPointsQuery,
    type TPredictQuery,
} from './water-analysis.api';

const HEATMAP_STALE_MS = 24 * 60 * 60 * 1000;
const PREDICT_STALE_MS = 5 * 60 * 1000;
const EQUIPMENT_STALE_MS = 10 * 60 * 1000;

const STALE_HEAVY = 24 * 60 * 60 * 1000;

export const waterMapKeys = {
    all: ['water-analysis'] as const,
    heatmap: (q: THeatmapQuery) => ['water-analysis', 'heatmap', q] as const,
    heatmapCell: (q: THeatmapCellQuery) => ['water-analysis', 'heatmap-cell', q] as const,
    predict: (q: TPredictQuery) => ['water-analysis', 'predict', q] as const,
    depthMap: (q: TDepthMapQuery) => ['water-analysis', 'depth-map', q] as const,
    depthPredict: (q: TDepthPredictQuery) => ['water-analysis', 'depth-predict', q] as const,
    points: (q: TPointsQuery) => ['water-analysis', 'points', q] as const,
    equipment: (b: TEquipmentSuggestBody) => ['water-analysis', 'equipment', b] as const,
    aquiferStats: (q: TAquiferStatsQuery) => ['water-analysis', 'aquifer-stats', q] as const,
};

export function useHeatmap(
    q: THeatmapQuery | null,
    options?: Partial<UseQueryOptions<THeatmapResponse>>,
) {
    return useQuery<THeatmapResponse>({
        queryKey: q ? waterMapKeys.heatmap(q) : ['water-analysis', 'heatmap', 'idle'],
        queryFn: ({ signal }) => fetchHeatmap(q!, signal),
        enabled: !!q,
        staleTime: HEATMAP_STALE_MS,
        ...options,
    });
}

export function usePredict(
    q: TPredictQuery | null,
    options?: Partial<UseQueryOptions<TPredictResponse>>,
) {
    return useQuery<TPredictResponse>({
        queryKey: q ? waterMapKeys.predict(q) : ['water-analysis', 'predict', 'idle'],
        queryFn: ({ signal }) => fetchPredict(q!, signal),
        enabled: !!q,
        staleTime: PREDICT_STALE_MS,
        ...options,
    });
}

export function useDepthMap(
    q: TDepthMapQuery | null,
    options?: Partial<UseQueryOptions<TDepthMapResponse>>,
) {
    return useQuery<TDepthMapResponse>({
        queryKey: q ? waterMapKeys.depthMap(q) : ['water-analysis', 'depth-map', 'idle'],
        queryFn: ({ signal }) => fetchDepthMap(q!, signal),
        enabled: !!q,
        staleTime: STALE_HEAVY,
        ...options,
    });
}

export function useDepthPredict(
    q: TDepthPredictQuery | null,
    options?: Partial<UseQueryOptions<TDepthPredictResponse>>,
) {
    return useQuery<TDepthPredictResponse>({
        queryKey: q ? waterMapKeys.depthPredict(q) : ['water-analysis', 'depth-predict', 'idle'],
        queryFn: ({ signal }) => fetchDepthPredict(q!, signal),
        enabled: !!q,
        staleTime: PREDICT_STALE_MS,
        ...options,
    });
}

export function usePoints(
    q: TPointsQuery | null,
    options?: Partial<UseQueryOptions<TPointsResponse>>,
) {
    return useQuery<TPointsResponse>({
        queryKey: q ? waterMapKeys.points(q) : ['water-analysis', 'points', 'idle'],
        queryFn: ({ signal }) => fetchPoints(q!, signal),
        enabled: !!q,
        staleTime: 60 * 60 * 1000,
        ...options,
    });
}

/**
 * equipment-suggest — POST с body. Используем useQuery (а не useMutation) потому
 * что результат идемпотентен (predict + catalog vector search) и его кешируем.
 */
export function useEquipmentSuggest(
    b: TEquipmentSuggestBody | null,
    options?: Partial<UseQueryOptions<TEquipmentSuggestResponse>>,
) {
    return useQuery<TEquipmentSuggestResponse>({
        queryKey: b ? waterMapKeys.equipment(b) : ['water-analysis', 'equipment', 'idle'],
        queryFn: ({ signal }) => postEquipmentSuggest(b!, signal),
        enabled: !!b,
        staleTime: EQUIPMENT_STALE_MS,
        ...options,
    });
}

/**
 * /heatmap/cell — детальный breakdown выбранной cell. Используем useQuery
 * (не useMutation): coords cell стабильные после клика, повторный clicks
 * на ту же cell дадут cache hit вместо повторного SQL.
 */
export function useHeatmapCellDetail(
    q: THeatmapCellQuery | null,
    options?: Partial<UseQueryOptions<THeatmapCellDetail>>,
) {
    return useQuery<THeatmapCellDetail>({
        queryKey: q ? waterMapKeys.heatmapCell(q) : ['water-analysis', 'heatmap-cell', 'idle'],
        queryFn: ({ signal }) => postHeatmapCellDetail(q!, signal),
        enabled: !!q,
        staleTime: HEATMAP_STALE_MS,
        ...options,
    });
}

export function useAquiferStats(
    q: TAquiferStatsQuery | null,
    options?: Partial<UseQueryOptions<TAquiferStatsResponse>>,
) {
    return useQuery<TAquiferStatsResponse>({
        queryKey: q ? waterMapKeys.aquiferStats(q) : ['water-analysis', 'aquifer-stats', 'idle'],
        queryFn: ({ signal }) => fetchAquiferStats(q!, signal),
        enabled: !!q,
        staleTime: STALE_HEAVY,
        ...options,
    });
}
