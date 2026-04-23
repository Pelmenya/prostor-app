'use client';

import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TServiceZone } from '../../model/t-service-zone';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

type TZoneMapProps = {
    zones: TServiceZone[];
    selectedZoneIds: number[];
    onToggle: (zoneId: number) => void;
    center?: { latitude: number; longitude: number };
};

// Бэкенд возвращает координаты в формате [lat, lng], GeoJSON требует [lng, lat]
function swapRing(ring: number[][]): number[][] {
    return ring.map(([lat, lng]) => [lng, lat]);
}

function toGeoJsonGeometry(coords: TServiceZone['coordinates']): GeoJSON.Geometry {
    if (!coords) throw new Error('no coords');
    if (coords.type === 'MultiPolygon') {
        return {
            type: 'MultiPolygon',
            coordinates: (coords.coordinates as number[][][][]).map((p) => p.map(swapRing)),
        };
    }
    return {
        type: 'Polygon',
        coordinates: (coords.coordinates as number[][][]).map(swapRing),
    };
}

export function ZoneMap({
    zones,
    selectedZoneIds,
    onToggle,
    center = { latitude: 55.7558, longitude: 37.6176 },
}: TZoneMapProps) {
    const zonesWithGeometry = zones.filter((z) => z.coordinates);

    const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: zonesWithGeometry.map((zone) => ({
            type: 'Feature',
            id: zone.id,
            geometry: toGeoJsonGeometry(zone.coordinates),
            properties: {
                color: zone.isActive ? zone.color : '#9CA3AF',
                selected: selectedZoneIds.includes(zone.id) ? 1 : 0,
            },
        })),
    };

    function handleMapClick(e: { features?: { id?: string | number }[] }) {
        const featureId = e.features?.[0]?.id;
        if (featureId == null) return;
        const id = typeof featureId === 'string' ? parseInt(featureId, 10) : Number(featureId);
        const zone = zonesWithGeometry.find((z) => z.id === id);
        if (zone && (zone.isActive || selectedZoneIds.includes(zone.id))) {
            onToggle(zone.id);
        }
    }

    return (
        <div
            className="w-full rounded-2xl overflow-hidden border border-base-300"
            style={{ height: '40vh' }}
        >
            <MapGL
                initialViewState={{
                    longitude: center.longitude,
                    latitude: center.latitude,
                    zoom: 9,
                }}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                interactiveLayerIds={['zone-fill']}
                onClick={handleMapClick}
            >
                <Source id="zones" type="geojson" data={geojson}>
                    <Layer
                        id="zone-fill"
                        type="fill"
                        paint={{
                            'fill-color': ['get', 'color'],
                            'fill-opacity': ['case', ['==', ['get', 'selected'], 1], 0.5, 0.15],
                        }}
                    />
                    <Layer
                        id="zone-outline"
                        type="line"
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': ['case', ['==', ['get', 'selected'], 1], 2.5, 1],
                            'line-opacity': ['case', ['==', ['get', 'selected'], 1], 1, 0.4],
                        }}
                    />
                </Source>
            </MapGL>
        </div>
    );
}
