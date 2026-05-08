import type { TAquiferLayer, TAquiferLayerId } from '@/entities/water-analysis';

/**
 * UI dictionary 5 водоносных горизонтов МО.
 * Источник: `slovo/.../water-analysis.constants.ts:AQUIFER_LAYERS`.
 *
 * Цвет для maplibre paint (по dominantLayerId) — diverging gradient от
 * приповерхностных слоёв (warm) к глубоким (cool blue).
 */
export type TAquiferLayerMeta = TAquiferLayer & {
    /** OKLCH hex для maplibre fill paint. */
    color: string;
};

export const AQUIFER_LAYERS: ReadonlyArray<TAquiferLayerMeta> = [
    {
        id: 'top_water',
        minDepth: 0,
        maxDepth: 15,
        label: '0-15м · Верховодка',
        color: '#a16207', // warm sand-yellow (поверхностные)
    },
    {
        id: 'sandy',
        minDepth: 15,
        maxDepth: 50,
        label: '15-50м · Песчаный',
        color: '#65a30d',
    },
    {
        id: 'sandy_limestone',
        minDepth: 50,
        maxDepth: 100,
        label: '50-100м · Песчано-известняковый',
        color: '#0891b2',
    },
    {
        id: 'limestone',
        minDepth: 100,
        maxDepth: 200,
        label: '100-200м · Известняковый',
        color: '#2563eb',
    },
    {
        id: 'artesian',
        minDepth: 200,
        maxDepth: null,
        label: '200м+ · Артезианский',
        color: '#7c3aed', // глубокий
    },
];

const BY_ID = new Map<string, TAquiferLayerMeta>(AQUIFER_LAYERS.map((l) => [l.id, l]));

export function aquiferLayerById(id: string): TAquiferLayerMeta | undefined {
    return BY_ID.get(id);
}

export function aquiferLayerLabel(id: string): string {
    return BY_ID.get(id)?.label ?? id;
}

export function aquiferLayerColor(id: string): string {
    return BY_ID.get(id)?.color ?? '#9ca3af';
}

/**
 * MapLibre `match` expression для paint-color по dominantLayerId. Используется
 * в depth-map fill / circle-color.
 */
export function aquiferMatchExpression(): unknown[] {
    const expr: unknown[] = ['match', ['get', 'dominantLayerId']];
    for (const layer of AQUIFER_LAYERS) {
        expr.push(layer.id, layer.color);
    }
    expr.push('#9ca3af'); // default fallback
    return expr;
}

export function isAquiferLayerId(id: string): id is TAquiferLayerId {
    return BY_ID.has(id);
}
