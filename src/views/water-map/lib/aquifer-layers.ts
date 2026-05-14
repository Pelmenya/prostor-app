import type { TAquiferLayer, TAquiferLayerId } from '@/entities/water-analysis';

/**
 * UI dictionary 5 водоносных горизонтов МО.
 * Источник: `slovo/.../water-analysis.constants.ts:AQUIFER_LAYERS`.
 *
 * Палитра — diverging gradient от приповерхностных (warm) к глубоким (cool).
 *
 * **Refresh 2026-05-14 (claude design followup):** Песчаный сдвинут с green
 * H150 (`#65a30d`) → khaki H95 (`#b59a40`) — раньше совпадал с severity-safe
 * (тоже H150), deuteranopia не различала safe water dot vs Песчаный aquifer
 * когда оба layer'а ON. ΔH 5° → 55°, ΔE 8 → 35.
 *
 * Hex-эквиваленты OKLCH (из `--wm-aquifer-*` в globals.css). Maplibre 5.x
 * не парсит oklch() в paint expressions — используем hex.
 */
export type TAquiferLayerMeta = TAquiferLayer & {
    color: string;
};

export const AQUIFER_LAYERS: ReadonlyArray<TAquiferLayerMeta> = [
    {
        id: 'top_water',
        minDepth: 0,
        maxDepth: 15,
        label: '0-15м · Верховодка',
        color: '#8b5a2b', // ~oklch(50% 0.09 55) — warm brown
    },
    {
        id: 'sandy',
        minDepth: 15,
        maxDepth: 50,
        label: '15-50м · Песчаный',
        color: '#65a30d', // lime-700 — оригинальный зелёный (откат khaki-варианта)
    },
    {
        id: 'sandy_limestone',
        minDepth: 50,
        maxDepth: 100,
        label: '50-100м · Песчано-известняковый',
        color: '#5ca9aa', // ~oklch(70% 0.10 195) — teal
    },
    {
        id: 'limestone',
        minDepth: 100,
        maxDepth: 200,
        label: '100-200м · Известняковый',
        color: '#3a6cd4', // ~oklch(55% 0.18 250) — blue
    },
    {
        id: 'artesian',
        minDepth: 200,
        maxDepth: null,
        label: '200м+ · Артезианский',
        color: '#7039a5', // ~oklch(48% 0.20 305) — purple (глубокий)
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
