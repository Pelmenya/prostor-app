import { slovoPost } from '@/shared/api';
import type { TSearchRequest, TSearchResponse } from '../model/types';

/**
 * POST /catalog/search — slovo Phase 1 (commit b1a5f28 от 2026-05-16).
 *
 * Throttle: 10/min/IPv6-/64. Image upload: 1..5 фото base64, ≤5MB декодированных,
 * JPEG/PNG/WebP. Vision cache 24h по SHA256 — повторный submit того же фото →
 * cache hit без re-vision-call.
 *
 * Dev-mock: при NEXT_PUBLIC_SMART_SEARCH_MOCK=1 возвращаем хардкод stub без
 * сетевого запроса — UI работает без slovo running локально. В prod флаг
 * никогда не выставляется (process.env.NEXT_PUBLIC_* инлайнится при билде).
 */

const MOCK_FLAG_ON = process.env.NEXT_PUBLIC_SMART_SEARCH_MOCK === '1';

const MOCK_DELAY_MS = 1400;

const MOCK_RESPONSE_TEXT: TSearchResponse = {
    count: 3,
    timeTakenMs: 480,
    docs: [
        {
            id: 'mock-doc-1',
            pageContent: 'Аквафор DWM-101S — система обратного осмоса под мойку',
            metadata: {
                externalId: 'mock-aquafor-dwm-101s',
                name: 'Аквафор DWM-101S',
                salePriceKopecks: 4500000,
                categoryPath: 'Фильтры / Обратный осмос',
                externalType: 'product',
                externalSource: 'moysklad',
            },
            imageUrls: [],
            matchScore: 91,
        },
        {
            id: 'mock-doc-2',
            pageContent: 'Гейзер Престиж 2 — компактная RO-система',
            metadata: {
                externalId: 'mock-geyser-prestige-2',
                name: 'Гейзер Престиж 2',
                salePriceKopecks: 3990000,
                categoryPath: 'Фильтры / Обратный осмос',
                externalType: 'product',
                externalSource: 'moysklad',
            },
            imageUrls: [],
            matchScore: 78,
        },
        {
            id: 'mock-doc-3',
            pageContent: 'Барьер Профи Осмо 100 — RO без насоса',
            metadata: {
                externalId: 'mock-barrier-profi-osmo-100',
                name: 'Барьер Профи Осмо 100',
                salePriceKopecks: 2890000,
                categoryPath: 'Фильтры / Обратный осмос',
                externalType: 'product',
                externalSource: 'moysklad',
            },
            imageUrls: [],
            matchScore: 62,
        },
    ],
    vision: null,
};

const MOCK_RESPONSE_PHOTO: TSearchResponse = {
    ...MOCK_RESPONSE_TEXT,
    timeTakenMs: 920,
    vision: {
        category: 'обратный осмос',
        description: 'Компактная система обратного осмоса под мойку, белый корпус, 4 колбы',
        confidence: 'high',
    },
};

export async function postSmartSearch(
    body: TSearchRequest,
    signal?: AbortSignal,
): Promise<TSearchResponse> {
    if (MOCK_FLAG_ON) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => {
                resolve(body.images?.length ? MOCK_RESPONSE_PHOTO : MOCK_RESPONSE_TEXT);
            }, MOCK_DELAY_MS);
            signal?.addEventListener('abort', () => {
                clearTimeout(t);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
    }
    return slovoPost<TSearchResponse>('/catalog/search', body, signal);
}
