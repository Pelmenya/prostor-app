/**
 * Severity для recommendation. `safe` исключён — нечего рекомендовать.
 */
export type TWaterProblemSeverity = 'borderline' | 'concerning' | 'unsafe';

export type TWaterProblem = {
    paramCode: string;
    severity: TWaterProblemSeverity;
    interval: { lower: number; upper: number };
    /** Простой ПДК (для большинства параметров) или диапазон (например ph). */
    pdk: number | { min: number; max: number };
    n: number;
};

export type TEquipmentRecommendation = {
    /**
     * MoySklad assortment UUID v4 — единственный stable identifier. Используется
     * для `/product/{externalId}` deep-link и cart `addProduct({id: externalId})`.
     * Slovo handoff 2026-05-15 13:05 (commit `dbf8589`) — rename из `sku`,
     * вариант A breaking (cache v4→v5).
     */
    externalId: string;
    name: string;
    relevance: number;
    description: string;
    matchedProblem: string;
    /** UI «почему этот товар» — показываем под названием. */
    reason: string;
    /**
     * Presigned MinIO URL первой картинки (TTL 1ч). Бэк уже резолвит через
     * StorageService — не нужно отдельного round-trip к crm-back МойСклад proxy.
     */
    imageUrl: string | null;
    /** Цена в копейках (5990 ₽ = 599000). null если нет в каталоге. */
    salePriceKopecks: number | null;
};

export type TEquipmentSuggestResponse = {
    problems: TWaterProblem[];
    recommendations: TEquipmentRecommendation[];
    searchQuery: string;
    nNeighbors: number;
    medianDistKm: number;
    insufficientData: boolean;
    timeTakenMs: number;
    cached: boolean;
};
