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
    sku: string;
    name: string;
    relevance: number;
    description: string;
    matchedProblem: string;
    /** UI «почему этот товар» — показываем под названием. */
    reason: string;
    imageUrl?: string;
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
