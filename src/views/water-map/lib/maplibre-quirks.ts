/**
 * Known maplibre-gl-js quirk: `feature.properties` доступ через click handler
 * (`map.on('click', LAYER, ...)`) или `queryRenderedFeatures` сериализует
 * любые non-primitive values (object / array) в JSON-string.
 *
 * Backend шлёт object → maplibre копирует в source → достаёт обратно как string.
 * Тестировалось 2026-05-13: `params: Record<paramCode, number>` стало string'ом
 * на фронте. Аналогично `aquiferLayers: TAquiferLayerCount[]` в depth-cell.
 *
 * Этот хелпер нормализует JSON-string обратно в object/array. Если уже object —
 * pass-through. Если parse failed — fallback.
 */
export function parseMaplibreObject<T>(raw: unknown, fallback: T): T {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === 'string') {
        try {
            const parsed: unknown = JSON.parse(raw);
            return parsed as T;
        } catch {
            return fallback;
        }
    }
    return raw as T;
}
