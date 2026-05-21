/**
 * Контракты POST /catalog/search (slovo Phase 1, commit b1a5f28 от 2026-05-16).
 *
 * Phase 1: matchScore — rank-based 95..45 (НЕ настоящий cosine). UI читает как
 * relevance %. Phase 2 — bypass через прямой pgvector <=> query, контракт shape
 * не меняется.
 *
 * vision.confidence — discrete 3-bucket (high/mid/low), bucketed на бэке
 * через toVisionConfidence helper из numeric Vision-describer score.
 */

export type TVisionConfidence = 'high' | 'mid' | 'low';

export type TVisionDto = {
    category: string;
    description: string;
    confidence: TVisionConfidence;
};

export type TSearchDocMetadata = {
    externalId: string;
    name: string;
    salePriceKopecks: number | null;
    categoryPath?: string;
    /**
     * Vision/MoySklad description — short product subtitle whitelisted в slovo
     * Phase 1 response. Используется в product card как subtitle. Если отсутствует
     * — fallback на последний segment categoryPath.
     */
    description?: string;
    externalType?: string;
    externalSource?: string;
};

export type TSearchDoc = {
    id: string;
    pageContent: string;
    metadata: TSearchDocMetadata;
    imageUrls: string[];
    matchScore: number;
};

export type TSearchResponse = {
    count: number;
    timeTakenMs: number;
    docs: TSearchDoc[];
    vision: TVisionDto | null;
};

export type TSearchRequestImage = {
    base64: string;
    mime: string;
};

export type TSearchRequest = {
    query?: string;
    topK?: number;
    images?: TSearchRequestImage[];
};

export type TSmartSearchStatus = 'idle' | 'loading' | 'success' | 'error';

export type TSmartSearchChipKind = 'photo' | 'article' | 'problem' | 'install' | 'address';
