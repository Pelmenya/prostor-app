'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { type Map as MaplibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useNearestRetailStoresByCoords, useRoutePolylineByCoords } from '@/entities/real-estate';
import type {
    TDepthMapResponse,
    THeatmapResponse,
    TPointsResponse,
} from '@/entities/water-analysis';
import type { TRetailStoreWithRouteInfo } from '@/shared/model';
import { useWaterMapStore, useClientPinStore } from '../model';
import {
    DEFAULT_ZOOM,
    MAP_STYLE_DARK,
    MAP_STYLE_LIGHT,
    MO_BBOX,
    aquiferMatchExpression,
    cellsCircleColorExpression,
    cellsCircleOpacityExpression,
    cellsCircleRadiusExpression,
    cellsCircleStrokeColorExpression,
    cellsCircleStrokeWidthExpression,
    coverageHeatmapColorExpression,
    coverageHeatmapIntensityExpression,
    coverageHeatmapOpacityExpression,
    coverageHeatmapRadiusExpression,
    coverageHeatmapWeightExpression,
    depthMapCircleRadiusExpression,
    depthMapCircleStrokeWidthExpression,
    heatmapColorExpression,
    heatmapIntensityExpression,
    heatmapOpacityExpression,
    heatmapRadiusExpression,
    heatmapWeightExpression,
    localizeMapLabels,
    pointsCircleColorExpression,
    pointsCircleOpacityExpression,
    pointsCircleRadiusExpression,
    snapBbox,
    useDepthMap,
    useHeatmap,
    usePoints,
} from '../lib';

const CELLS_SOURCE_ID = 'wm-cells';
const CELLS_HEATMAP_LAYER_ID = 'wm-cells-heatmap';
const CELLS_LAYER_ID = 'wm-cells-layer';
const COVERAGE_SOURCE_ID = 'wm-coverage';
const COVERAGE_LAYER_ID = 'wm-coverage-heatmap';
const DEPTH_SOURCE_ID = 'wm-depth';
const DEPTH_LAYER_ID = 'wm-depth-layer';
const POINTS_SOURCE_ID = 'wm-points';
const POINTS_LAYER_ID = 'wm-points-layer';
const STORES_SOURCE_ID = 'wm-stores';
const STORES_LAYER_ID = 'wm-stores-layer';
const ROUTE_SOURCE_ID = 'wm-route';
const ROUTE_LAYER_ID = 'wm-route-layer';
const PIN_SOURCE_ID = 'wm-client-pin';
const RADIUS_SOURCE_ID = 'wm-similar-radius';
const RADIUS_LAYER_ID = 'wm-similar-radius-layer';
const RADIUS_OUTLINE_ID = 'wm-similar-radius-outline';

const EMPTY_HEATMAP: THeatmapResponse = {
    type: 'FeatureCollection',
    features: [],
    param: '',
    pdk: 0,
    grid: 0.05,
    timeTakenMs: 0,
    cached: false,
};
const EMPTY_POINTS: TPointsResponse = {
    type: 'FeatureCollection',
    features: [],
    count: 0,
    truncated: false,
    limit: 200,
    timeTakenMs: 0,
    cached: false,
};
const EMPTY_DEPTH: TDepthMapResponse = {
    type: 'FeatureCollection',
    features: [],
    intakeType: 'all',
    grid: 0.05,
    timeTakenMs: 0,
    cached: false,
};
const EMPTY_STORES: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * Преобразовать список retail-stores в GeoJSON FeatureCollection. Координаты
 * берём из `coordinates.coordinates` (GeoJSON Point), properties — name /
 * address / duration / distance / availability + organization metadata.
 */
function storesToFeatureCollection(
    storesList: TRetailStoreWithRouteInfo[],
): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: storesList.map((s) => ({
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: s.coordinates.coordinates,
            },
            properties: {
                id: s.id,
                name: s.name,
                address: s.address,
                duration: s.duration,
                distance: s.distance,
                availability: s.availability ?? 'partial',
                organizationName: s.organizationName ?? null,
            },
        })),
    };
}

/**
 * Полигон-окружность вокруг lat/lon заданного радиуса (км). 64 сегмента —
 * визуально круг без видимого polygon-pixelation. Earth radius ≈ 6371км.
 */
function circlePolygon(
    lat: number,
    lon: number,
    radiusKm: number,
    steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
    const earthR = 6371;
    const latRad = (lat * Math.PI) / 180;
    const dLat = (radiusKm / earthR) * (180 / Math.PI);
    const dLonAtLat = (radiusKm / (earthR * Math.cos(latRad))) * (180 / Math.PI);
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * 2 * Math.PI;
        coords.push([lon + dLonAtLat * Math.cos(a), lat + dLat * Math.sin(a)]);
    }
    return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
    };
}

type TWaterMapCanvasProps = {
    theme: 'light' | 'dark';
    onCellClick?: (coords: [number, number], properties: Record<string, unknown>) => void;
    onPointClick?: (coords: [number, number], properties: Record<string, unknown>) => void;
    onDepthClick?: (coords: [number, number], properties: Record<string, unknown>) => void;
    onStoreClick?: (coords: [number, number], properties: Record<string, unknown>) => void;
    /** Получить ref на MapLibre instance после load — для overlay-кнопок зума. */
    onMapReady?: (map: MaplibreMap) => void;
};

/**
 * MapLibre-карта в полную область. Загружается только на клиенте через next/dynamic.
 *
 * Слои:
 *  - CELLS (circle layer, dots по cells) — главный визуал агрегатов. Радиус
 *    zoom-scaled (НЕ от count — это давало blob-Москвы), цвет по `exceedsPct`.
 *    Прототип `prostor-heatmap-mobile-standalone.html` показывает россыпь
 *    точек, не density blending — это правильный подход.
 *  - POINTS (circle layer, individual анализы) — на zoom > 11 cells fade-out
 *    и появляются реальные точки из /water-analysis/points. Здесь circle
 *    оправдан — это honest individual data.
 *  - PIN (DOM marker) — пин клиента (WaterDrop SVG).
 *  - RADIUS (fill+line) — radius-кольцо «Похожие рядом».
 */
export function WaterMapCanvas({
    theme,
    onCellClick,
    onPointClick,
    onDepthClick,
    onStoreClick,
    onMapReady,
}: TWaterMapCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MaplibreMap | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [bbox, setBbox] = useState({ ...MO_BBOX });
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);

    const selectedParam = useWaterMapStore((s) => s.selectedParam);
    const activeLayers = useWaterMapStore((s) => s.activeLayers);
    const cellsViewMode = useWaterMapStore((s) => s.cellsViewMode);
    const intakeType = useWaterMapStore((s) => s.intakeType);
    const setSelectedCellCoords = useWaterMapStore((s) => s.setSelectedCellCoords);
    const similarOn = useWaterMapStore((s) => s.similarOn);
    const similarRadiusKm = useWaterMapStore((s) => s.similarRadiusKm);
    const pinPlacementMode = useWaterMapStore((s) => s.pinPlacementMode);
    const setPinPlacementMode = useWaterMapStore((s) => s.setPinPlacementMode);
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);

    const heatmapEnabled = activeLayers.has('heatmap');
    // Layer visibility: «Качество воды» toggle ⨯ view-mode (spline/dots/both).
    // Если параметр toggled OFF — оба невидимы. Иначе по mode.
    const splineVisible =
        heatmapEnabled && (cellsViewMode === 'spline' || cellsViewMode === 'both');
    const dotsVisible = heatmapEnabled && (cellsViewMode === 'dots' || cellsViewMode === 'both');
    const heatmapQuery = heatmapEnabled
        ? { ...snapBbox(bbox, 0.05), param: selectedParam, grid: 0.05 }
        : null;
    const heatmap = useHeatmap(heatmapQuery);

    const coverageEnabled = activeLayers.has('coverage');
    const coverageQuery = coverageEnabled
        ? { ...snapBbox(bbox, 0.05), param: 'coverage' as const, grid: 0.05 }
        : null;
    const coverage = useHeatmap(coverageQuery);

    const depthEnabled = activeLayers.has('depthMap');
    const depthQuery = depthEnabled ? { ...snapBbox(bbox, 0.05), intakeType, grid: 0.05 } : null;
    const depth = useDepthMap(depthQuery);

    const pointsEnabled = activeLayers.has('points');
    const pointsQuery =
        pointsEnabled && zoom >= 10 ? { ...snapBbox(bbox, 0.02), limit: 200 } : null;
    const points = usePoints(pointsQuery);

    // Stores layer: public endpoint /retail-stores/nearest по любым координатам
    // pin'a (real-estate / геолокация / manual). Не требует auth.
    const storesEnabled = activeLayers.has('stores');
    const storesParams = storesEnabled && pin ? { lat: pin.lat, lon: pin.lon, limit: 20 } : null;
    const stores = useNearestRetailStoresByCoords(storesParams);

    // Route polyline: рисуется когда юзер тапнул «Маршрут» в StorePopup и в
    // store выставлен `selectedRouteTo`. From — текущий pin (любого source).
    const selectedRouteTo = useWaterMapStore((s) => s.selectedRouteTo);
    const routeParams =
        selectedRouteTo && pin
            ? {
                  from: [pin.lon, pin.lat] as [number, number],
                  to: selectedRouteTo,
              }
            : null;
    const route = useRoutePolylineByCoords(routeParams);

    // Создаём карту один раз
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Стартуем сразу на bounds МО (`MO_BBOX`) с маленьким padding —
        // важно чтобы на mobile 390×844 юзер видел overview всего региона
        // (где интересные оранжево-красные кластеры), не Москва-центр.
        // На desktop 1280×800 fitBounds выберет zoom ~9, на mobile ~7.5
        // — оба показывают полный МО.
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
            bounds: [
                [MO_BBOX.west, MO_BBOX.south],
                [MO_BBOX.east, MO_BBOX.north],
            ],
            fitBoundsOptions: { padding: 16, duration: 0 },
            attributionControl: false,
        });
        mapRef.current = map;

        // DEBUG: dev-only exposure для Playwright диагностики (slovo-claude
        // 2026-05-13 20:10). Удалить когда points-zoom15 bug закроется.
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            (window as unknown as { __mlmap?: MaplibreMap }).__mlmap = map;
        }

        // NavigationControl убран — кастомные кнопки zoomIn/Out рендерятся
        // в page-overlay через onMapReady callback (без !important hacks
        // против maplibre-gl.css).
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        // Локализация labels — слушаем `styledata` (fires при загрузке style
        // и каждом switch'е), это покрывает first-render + zoom-in/out
        // tile-reload без проскока english. `'load'` срабатывает раньше но
        // только один раз, чего недостаточно — base style может перекрашивать
        // labels при zoom-dependent layers.
        const relocalize = () => localizeMapLabels(map);
        map.on('styledata', relocalize);

        map.on('load', () => {
            onMapReady?.(map);
            // ---- CELLS source — общий для heatmap-blobs и circle-dots
            map.addSource(CELLS_SOURCE_ID, { type: 'geojson', data: EMPTY_HEATMAP });

            // Predator-style stacked: heatmap UNDERNEATH (smooth gradient blobs)
            // + circle dots OVER (точные pinpoints с обводкой).
            // Heatmap pure background — не реагирует на click, click handler
            // навешан только на CELLS_LAYER_ID (circle).
            map.addLayer({
                id: CELLS_HEATMAP_LAYER_ID,
                type: 'heatmap',
                source: CELLS_SOURCE_ID,
                maxzoom: 14,
                paint: {
                    'heatmap-weight': heatmapWeightExpression() as never,
                    'heatmap-intensity': heatmapIntensityExpression() as never,
                    'heatmap-color': heatmapColorExpression() as never,
                    'heatmap-radius': heatmapRadiusExpression() as never,
                    'heatmap-opacity': heatmapOpacityExpression() as never,
                },
                layout: { visibility: 'none' },
            });

            map.addLayer({
                id: CELLS_LAYER_ID,
                type: 'circle',
                source: CELLS_SOURCE_ID,
                maxzoom: 14,
                paint: {
                    'circle-radius': cellsCircleRadiusExpression() as never,
                    'circle-color': cellsCircleColorExpression() as never,
                    'circle-opacity': cellsCircleOpacityExpression() as never,
                    'circle-stroke-width': cellsCircleStrokeWidthExpression() as never,
                    'circle-stroke-color': cellsCircleStrokeColorExpression() as never,
                },
                layout: { visibility: 'none' },
            });

            // ---- COVERAGE layer (density-режим, grey-scale, отдельный toggle)
            map.addSource(COVERAGE_SOURCE_ID, { type: 'geojson', data: EMPTY_HEATMAP });
            map.addLayer({
                id: COVERAGE_LAYER_ID,
                type: 'heatmap',
                source: COVERAGE_SOURCE_ID,
                maxzoom: 14,
                paint: {
                    'heatmap-weight': coverageHeatmapWeightExpression() as never,
                    'heatmap-intensity': coverageHeatmapIntensityExpression() as never,
                    'heatmap-color': coverageHeatmapColorExpression() as never,
                    'heatmap-radius': coverageHeatmapRadiusExpression() as never,
                    'heatmap-opacity': coverageHeatmapOpacityExpression() as never,
                },
                layout: { visibility: 'none' },
            });

            // ---- DEPTH-MAP layer (drilling USP-4, цвет по dominantLayerId)
            map.addSource(DEPTH_SOURCE_ID, { type: 'geojson', data: EMPTY_DEPTH });
            map.addLayer({
                id: DEPTH_LAYER_ID,
                type: 'circle',
                source: DEPTH_SOURCE_ID,
                paint: {
                    'circle-radius': depthMapCircleRadiusExpression() as never,
                    'circle-color': aquiferMatchExpression() as never,
                    'circle-opacity': 0.85,
                    'circle-stroke-width': depthMapCircleStrokeWidthExpression() as never,
                    'circle-stroke-color': cellsCircleStrokeColorExpression() as never,
                },
                layout: { visibility: 'none' },
            });

            // ---- POINTS layer (individual анализы, high-zoom > 11)
            map.addSource(POINTS_SOURCE_ID, { type: 'geojson', data: EMPTY_POINTS });
            map.addLayer({
                id: POINTS_LAYER_ID,
                type: 'circle',
                source: POINTS_SOURCE_ID,
                minzoom: 10,
                paint: {
                    'circle-color': pointsCircleColorExpression() as never,
                    'circle-radius': pointsCircleRadiusExpression() as never,
                    'circle-opacity': pointsCircleOpacityExpression() as never,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(255,255,255,0.85)',
                },
                layout: { visibility: 'none' },
            });

            // ---- STORES layer (точки продаж / приёма анализа)
            // Brand-marker через circle: outer ring белый, fill primary-blue,
            // inner cross-mark делается через stroke-color интерактивно.
            // Symbol layer с custom иконкой требует sprite atlas — для MVP
            // circle достаточно. Цвет по availability: full=green, partial=orange.
            map.addSource(STORES_SOURCE_ID, { type: 'geojson', data: EMPTY_STORES });
            map.addLayer({
                id: STORES_LAYER_ID,
                type: 'circle',
                source: STORES_SOURCE_ID,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8,
                        6,
                        12,
                        10,
                        15,
                        14,
                    ] as never,
                    'circle-color': [
                        'case',
                        ['==', ['get', 'availability'], 'full'],
                        '#22c55e', // green-500
                        '#f59e0b', // amber-500 — partial / unknown
                    ] as never,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2.5,
                    'circle-opacity': 0.95,
                },
                layout: { visibility: 'none' },
            });

            // ---- ROUTE polyline (OSRM от pin к выбранной точке продаж)
            // Рисуется НАД cells/coverage но ПОД stores/points (чтобы маркеры
            // были визуально поверх линии). LineString layer с двумя
            // паралельными штрихами — outer white halo для контраста на
            // любом фоне + inner primary.
            map.addSource(ROUTE_SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
                id: `${ROUTE_LAYER_ID}-halo`,
                type: 'line',
                source: ROUTE_SOURCE_ID,
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                    visibility: 'none',
                },
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 7,
                    'line-opacity': 0.85,
                },
            });
            map.addLayer({
                id: ROUTE_LAYER_ID,
                type: 'line',
                source: ROUTE_SOURCE_ID,
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                    visibility: 'none',
                },
                paint: {
                    'line-color': '#2563eb', // primary blue
                    'line-width': 4,
                    'line-opacity': 0.95,
                },
            });

            // ---- PIN
            map.addSource(PIN_SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            // ---- RADIUS (similar)
            map.addSource(RADIUS_SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
                id: RADIUS_LAYER_ID,
                type: 'fill',
                source: RADIUS_SOURCE_ID,
                paint: {
                    'fill-color': '#10b981',
                    'fill-opacity': 0.08,
                },
                layout: { visibility: 'none' },
            });
            map.addLayer({
                id: RADIUS_OUTLINE_ID,
                type: 'line',
                source: RADIUS_SOURCE_ID,
                paint: {
                    'line-color': '#10b981',
                    'line-width': 1.5,
                    'line-dasharray': [4, 3],
                },
                layout: { visibility: 'none' },
            });

            // Cursor changes
            const setPointerCursor = () => (map.getCanvas().style.cursor = 'pointer');
            const resetCursor = () => (map.getCanvas().style.cursor = '');
            map.on('mouseenter', CELLS_LAYER_ID, setPointerCursor);
            map.on('mouseleave', CELLS_LAYER_ID, resetCursor);
            map.on('mouseenter', POINTS_LAYER_ID, setPointerCursor);
            map.on('mouseleave', POINTS_LAYER_ID, resetCursor);
            map.on('mouseenter', DEPTH_LAYER_ID, setPointerCursor);
            map.on('mouseleave', DEPTH_LAYER_ID, resetCursor);
            map.on('mouseenter', STORES_LAYER_ID, setPointerCursor);
            map.on('mouseleave', STORES_LAYER_ID, resetCursor);

            // Click на cell — circle layer рендерит features individually,
            // queryRenderedFeatures возвращает их корректно.
            map.on('click', CELLS_LAYER_ID, (e) => {
                const f = e.features?.[0];
                if (!f) return;
                const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
                setSelectedCellCoords([coords[1], coords[0]]);
                onCellClick?.([coords[1], coords[0]], f.properties ?? {});
            });

            // Click на individual point
            map.on('click', POINTS_LAYER_ID, (e) => {
                const f = e.features?.[0];
                if (!f) return;
                const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
                onPointClick?.([coords[1], coords[0]], f.properties ?? {});
            });

            // Click на depth cell — drilling popup
            map.on('click', DEPTH_LAYER_ID, (e) => {
                const f = e.features?.[0];
                if (!f) return;
                const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
                onDepthClick?.([coords[1], coords[0]], f.properties ?? {});
            });

            // Click на store marker — mini-popup
            map.on('click', STORES_LAYER_ID, (e) => {
                const f = e.features?.[0];
                if (!f) return;
                const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
                onStoreClick?.([coords[1], coords[0]], f.properties ?? {});
            });

            // bbox/zoom tracking
            const updateView = () => {
                const b = map.getBounds();
                setBbox({
                    west: b.getWest(),
                    south: b.getSouth(),
                    east: b.getEast(),
                    north: b.getNorth(),
                });
                setZoom(map.getZoom());
            };
            map.on('moveend', updateView);
            map.on('zoomend', updateView);
            updateView();

            setMapReady(true);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Theme switch — setStyle сбрасывает sources/layers, переподписываемся
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const newStyle = theme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;

        const reattach = () => {
            // setStyle сбрасывает label-locale, но `'styledata'` listener
            // выше повторно прогонит localizeMapLabels — здесь дублировать
            // не нужно.
            if (!map.getSource(CELLS_SOURCE_ID)) {
                map.addSource(CELLS_SOURCE_ID, {
                    type: 'geojson',
                    data: heatmap.data ?? EMPTY_HEATMAP,
                });
                map.addLayer({
                    id: CELLS_HEATMAP_LAYER_ID,
                    type: 'heatmap',
                    source: CELLS_SOURCE_ID,
                    maxzoom: 14,
                    paint: {
                        'heatmap-weight': heatmapWeightExpression() as never,
                        'heatmap-intensity': heatmapIntensityExpression() as never,
                        'heatmap-color': heatmapColorExpression() as never,
                        'heatmap-radius': heatmapRadiusExpression() as never,
                        'heatmap-opacity': heatmapOpacityExpression() as never,
                    },
                    layout: { visibility: splineVisible ? 'visible' : 'none' },
                });
                map.addLayer({
                    id: CELLS_LAYER_ID,
                    type: 'circle',
                    source: CELLS_SOURCE_ID,
                    maxzoom: 14,
                    paint: {
                        'circle-radius': cellsCircleRadiusExpression() as never,
                        'circle-color': cellsCircleColorExpression() as never,
                        'circle-opacity': cellsCircleOpacityExpression() as never,
                        'circle-stroke-width': cellsCircleStrokeWidthExpression() as never,
                        'circle-stroke-color': cellsCircleStrokeColorExpression() as never,
                    },
                    layout: { visibility: dotsVisible ? 'visible' : 'none' },
                });
            }
            if (!map.getSource(COVERAGE_SOURCE_ID)) {
                map.addSource(COVERAGE_SOURCE_ID, {
                    type: 'geojson',
                    data: coverage.data ?? EMPTY_HEATMAP,
                });
                map.addLayer({
                    id: COVERAGE_LAYER_ID,
                    type: 'heatmap',
                    source: COVERAGE_SOURCE_ID,
                    maxzoom: 14,
                    paint: {
                        'heatmap-weight': coverageHeatmapWeightExpression() as never,
                        'heatmap-intensity': coverageHeatmapIntensityExpression() as never,
                        'heatmap-color': coverageHeatmapColorExpression() as never,
                        'heatmap-radius': coverageHeatmapRadiusExpression() as never,
                        'heatmap-opacity': coverageHeatmapOpacityExpression() as never,
                    },
                    layout: { visibility: coverageEnabled ? 'visible' : 'none' },
                });
            }
            if (!map.getSource(DEPTH_SOURCE_ID)) {
                map.addSource(DEPTH_SOURCE_ID, {
                    type: 'geojson',
                    data: depth.data ?? EMPTY_DEPTH,
                });
                map.addLayer({
                    id: DEPTH_LAYER_ID,
                    type: 'circle',
                    source: DEPTH_SOURCE_ID,
                    paint: {
                        'circle-radius': depthMapCircleRadiusExpression() as never,
                        'circle-color': aquiferMatchExpression() as never,
                        'circle-opacity': 0.85,
                        'circle-stroke-width': depthMapCircleStrokeWidthExpression() as never,
                        'circle-stroke-color': cellsCircleStrokeColorExpression() as never,
                    },
                    layout: { visibility: depthEnabled ? 'visible' : 'none' },
                });
            }
            if (!map.getSource(POINTS_SOURCE_ID)) {
                map.addSource(POINTS_SOURCE_ID, {
                    type: 'geojson',
                    data: points.data ?? EMPTY_POINTS,
                });
                map.addLayer({
                    id: POINTS_LAYER_ID,
                    type: 'circle',
                    source: POINTS_SOURCE_ID,
                    minzoom: 10,
                    paint: {
                        'circle-color': pointsCircleColorExpression() as never,
                        'circle-radius': pointsCircleRadiusExpression() as never,
                        'circle-opacity': pointsCircleOpacityExpression() as never,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': 'rgba(255,255,255,0.85)',
                    },
                    layout: { visibility: pointsEnabled ? 'visible' : 'none' },
                });
            }
            if (!map.getSource(STORES_SOURCE_ID)) {
                map.addSource(STORES_SOURCE_ID, {
                    type: 'geojson',
                    data: stores.data ? storesToFeatureCollection(stores.data) : EMPTY_STORES,
                });
                map.addLayer({
                    id: STORES_LAYER_ID,
                    type: 'circle',
                    source: STORES_SOURCE_ID,
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            8,
                            6,
                            12,
                            10,
                            15,
                            14,
                        ] as never,
                        'circle-color': [
                            'case',
                            ['==', ['get', 'availability'], 'full'],
                            '#22c55e',
                            '#f59e0b',
                        ] as never,
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 2.5,
                        'circle-opacity': 0.95,
                    },
                    layout: { visibility: storesEnabled ? 'visible' : 'none' },
                });
            }
            if (!map.getSource(PIN_SOURCE_ID)) {
                map.addSource(PIN_SOURCE_ID, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] },
                });
            }
            if (!map.getSource(RADIUS_SOURCE_ID)) {
                map.addSource(RADIUS_SOURCE_ID, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] },
                });
                map.addLayer({
                    id: RADIUS_LAYER_ID,
                    type: 'fill',
                    source: RADIUS_SOURCE_ID,
                    paint: { 'fill-color': '#10b981', 'fill-opacity': 0.08 },
                });
                map.addLayer({
                    id: RADIUS_OUTLINE_ID,
                    type: 'line',
                    source: RADIUS_SOURCE_ID,
                    paint: {
                        'line-color': '#10b981',
                        'line-width': 1.5,
                        'line-dasharray': [4, 3],
                    },
                });
            }
        };

        map.once('styledata', reattach);
        map.setStyle(newStyle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);

    // Cells data → setData
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(CELLS_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        if (heatmap.data) {
            src.setData(heatmap.data);
        } else if (!heatmap.isLoading) {
            src.setData(EMPTY_HEATMAP);
        }
    }, [heatmap.data, heatmap.isLoading, mapReady]);

    // Coverage data → setData
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(COVERAGE_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        if (coverage.data) {
            src.setData(coverage.data);
        } else if (!coverage.isLoading) {
            src.setData(EMPTY_HEATMAP);
        }
    }, [coverage.data, coverage.isLoading, mapReady]);

    // Coverage visibility (toggle «Покрытие архива»)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (map.getLayer(COVERAGE_LAYER_ID)) {
            map.setLayoutProperty(
                COVERAGE_LAYER_ID,
                'visibility',
                coverageEnabled ? 'visible' : 'none',
            );
        }
    }, [coverageEnabled, mapReady]);

    // Depth-map data → setData
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(DEPTH_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        if (depth.data) {
            src.setData(depth.data);
        } else if (!depth.isLoading) {
            src.setData(EMPTY_DEPTH);
        }
    }, [depth.data, depth.isLoading, mapReady]);

    // Depth visibility (toggle «Глубина скважин»)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (map.getLayer(DEPTH_LAYER_ID)) {
            map.setLayoutProperty(DEPTH_LAYER_ID, 'visibility', depthEnabled ? 'visible' : 'none');
        }
    }, [depthEnabled, mapReady]);

    // Stores data → setData (transform retail-stores в FeatureCollection)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(STORES_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        if (stores.data) {
            src.setData(storesToFeatureCollection(stores.data));
        } else if (!stores.isLoading) {
            src.setData(EMPTY_STORES);
        }
    }, [stores.data, stores.isLoading, mapReady]);

    // Route polyline data → setData + visibility
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;

        const coords = route.data?.routes?.[0]?.geometry?.coordinates;
        const visible = !!selectedRouteTo && !!coords && coords.length >= 2;

        if (visible && coords) {
            src.setData({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'LineString', coordinates: coords },
                    },
                ],
            });
        } else {
            src.setData({ type: 'FeatureCollection', features: [] });
        }

        const v = visible ? 'visible' : 'none';
        if (map.getLayer(ROUTE_LAYER_ID)) {
            map.setLayoutProperty(ROUTE_LAYER_ID, 'visibility', v);
        }
        if (map.getLayer(`${ROUTE_LAYER_ID}-halo`)) {
            map.setLayoutProperty(`${ROUTE_LAYER_ID}-halo`, 'visibility', v);
        }
    }, [route.data, selectedRouteTo, mapReady]);

    // Stores visibility (toggle «Точки продаж и приёма»)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (map.getLayer(STORES_LAYER_ID)) {
            map.setLayoutProperty(
                STORES_LAYER_ID,
                'visibility',
                storesEnabled ? 'visible' : 'none',
            );
        }
    }, [storesEnabled, mapReady]);

    // Points data → setData
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(POINTS_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;
        if (points.data) {
            src.setData(points.data);
        } else if (!points.isLoading) {
            src.setData(EMPTY_POINTS);
        }
    }, [points.data, points.isLoading, mapReady]);

    // Cells visibility — heatmap blobs и dots независимо по view-mode.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (map.getLayer(CELLS_HEATMAP_LAYER_ID)) {
            map.setLayoutProperty(
                CELLS_HEATMAP_LAYER_ID,
                'visibility',
                splineVisible ? 'visible' : 'none',
            );
        }
        if (map.getLayer(CELLS_LAYER_ID)) {
            map.setLayoutProperty(CELLS_LAYER_ID, 'visibility', dotsVisible ? 'visible' : 'none');
        }
    }, [splineVisible, dotsVisible, mapReady]);

    // Points visibility — управляем через layout (toggle от юзера) и minzoom
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (map.getLayer(POINTS_LAYER_ID)) {
            map.setLayoutProperty(
                POINTS_LAYER_ID,
                'visibility',
                pointsEnabled ? 'visible' : 'none',
            );
        }
    }, [pointsEnabled, mapReady]);

    // Client pin — DOM-based маркер с каплей
    const pinMarkerRef = useRef<maplibregl.Marker | null>(null);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        if (!pin) {
            pinMarkerRef.current?.remove();
            pinMarkerRef.current = null;
            return;
        }

        if (!pinMarkerRef.current) {
            // Maplibre.Marker применяет transform: translate(Xpx, Ypx) на
            // переданный element для позиционирования на карте. Поэтому
            // animation НЕ может trogать transform на outer .wm-pin element —
            // перезатрёт maplibre positioning, и pin «улетит». Wrap SVG
            // в inner div .wm-pin-inner, animation работает на нём.
            const el = document.createElement('div');
            el.className = 'wm-pin';
            el.innerHTML = `
                <div class="wm-pin-inner">
                    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2 C22 10 28 16 28 24 a12 12 0 1 1-24 0 c0-8 6-14 12-22z"
                            fill="oklch(58% 0.22 250)" stroke="white" stroke-width="2"/>
                        <circle cx="16" cy="22" r="4" fill="white"/>
                    </svg>
                </div>
            `;
            el.style.cursor = 'pointer';
            pinMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([pin.lon, pin.lat])
                .addTo(map);
        } else {
            pinMarkerRef.current.setLngLat([pin.lon, pin.lat]);
        }
    }, [pin, mapReady]);

    // Pin placement mode — слушаем next click на карте и ставим pin.
    // After click автоматически выключаем mode. Cursor — crosshair для
    // visual cue. Layer-specific click handler'ы тоже сработают (если попал
    // в feature), но это OK — pin всё равно ставится по lngLat клика.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        if (!pinPlacementMode) {
            map.getCanvas().style.cursor = '';
            return;
        }
        map.getCanvas().style.cursor = 'crosshair';
        const handleClick = (e: maplibregl.MapMouseEvent) => {
            setPin({
                lat: e.lngLat.lat,
                lon: e.lngLat.lng,
                source: 'manual',
                label: `${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}`,
            });
            setPinPlacementMode(false);
        };
        map.once('click', handleClick);
        return () => {
            map.off('click', handleClick);
            map.getCanvas().style.cursor = '';
        };
    }, [pinPlacementMode, mapReady, setPin, setPinPlacementMode]);

    // Radius circle (similar)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const src = map.getSource(RADIUS_SOURCE_ID) as GeoJSONSource | undefined;
        if (!src) return;

        const visible = similarOn && !!pin;
        if (visible && pin) {
            const fc: GeoJSON.FeatureCollection = {
                type: 'FeatureCollection',
                features: [circlePolygon(pin.lat, pin.lon, similarRadiusKm)],
            };
            src.setData(fc);
        } else {
            src.setData({ type: 'FeatureCollection', features: [] });
        }
        if (map.getLayer(RADIUS_LAYER_ID)) {
            map.setLayoutProperty(RADIUS_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
        }
        if (map.getLayer(RADIUS_OUTLINE_ID)) {
            map.setLayoutProperty(RADIUS_OUTLINE_ID, 'visibility', visible ? 'visible' : 'none');
        }
    }, [similarOn, similarRadiusKm, pin, mapReady]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 size-full"
            data-testid="water-map-canvas"
        />
    );
}
