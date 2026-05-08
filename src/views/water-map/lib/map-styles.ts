/**
 * MapLibre styles. Light = CartoDB Voyager, Dark = CartoDB Dark Matter.
 * Бесплатные OSM-based тайлы без API key, с retina + cyrillic support.
 *
 * Переключение темы — через [data-theme="dark"] на html (daisyui).
 * Карта реагирует через `useEffect` на изменение theme attribute и
 * `map.setStyle(...)`.
 */
export const MAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
export const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/**
 * Default viewport — Москва + ближнее Подмосковье. Соответствует bbox
 * прототипа `prostor-heatmap-mobile-standalone.html`. Bbox мы пересчитываем
 * на лету из map.getBounds() для запросов heatmap/depth-map.
 */
export const DEFAULT_CENTER: [number, number] = [37.617, 55.756]; // Москва
export const DEFAULT_ZOOM = 9;
export const MO_BBOX = {
    west: 36.5,
    south: 54.8,
    east: 39.0,
    north: 56.5,
};

/**
 * Округлить bbox до grid-кратности — кеш TanStack Query будет хитить
 * между близкими запросами вместо пересчёта на каждое 0.001° смещение карты.
 * Без этого пользовательский pan генерирует unique queryKey каждые 50ms.
 */
export function snapBbox<T extends { west: number; south: number; east: number; north: number }>(
    bbox: T,
    snapDeg = 0.05,
): T {
    const snap = (n: number, mode: 'floor' | 'ceil') => {
        const k = n / snapDeg;
        return mode === 'floor' ? Math.floor(k) * snapDeg : Math.ceil(k) * snapDeg;
    };
    return {
        ...bbox,
        west: snap(bbox.west, 'floor'),
        south: snap(bbox.south, 'floor'),
        east: snap(bbox.east, 'ceil'),
        north: snap(bbox.north, 'ceil'),
    };
}
