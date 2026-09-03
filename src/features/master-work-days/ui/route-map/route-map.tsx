'use client';

import MapGL, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TOsrmRoute } from '../../api/work-days.api';

import { MAP_STYLE } from '@/shared/config';

type TStop = {
    id: number;
    address: string;
    coordinates: [number, number]; // [lon, lat]
};

type TRouteMapProps = {
    route: TOsrmRoute;
    stops: TStop[];
    homeCoordinates?: [number, number]; // [lon, lat]
};

export function RouteMap({ route, stops, homeCoordinates }: TRouteMapProps) {
    const routeGeoJson: GeoJSON.Feature = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: route.geometry.coordinates,
        },
        properties: {},
    };

    const center = homeCoordinates ?? route.geometry.coordinates[0];

    return (
        <div className="rounded-2xl overflow-hidden h-64 w-full">
            <MapGL
                initialViewState={{ longitude: center[0], latitude: center[1], zoom: 11 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={MAP_STYLE}
                scrollZoom={false}
            >
                <Source id="route" type="geojson" data={routeGeoJson}>
                    <Layer
                        id="route-line"
                        type="line"
                        paint={{ 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 0.8 }}
                    />
                </Source>

                {homeCoordinates && (
                    <Marker
                        longitude={homeCoordinates[0]}
                        latitude={homeCoordinates[1]}
                        anchor="center"
                    >
                        <div className="size-4 rounded-full bg-primary border-2 border-white shadow-md" />
                    </Marker>
                )}

                {stops.map((stop, i) => (
                    <Marker
                        key={stop.id}
                        longitude={stop.coordinates[0]}
                        latitude={stop.coordinates[1]}
                        anchor="center"
                    >
                        <div className="flex items-center justify-center size-6 rounded-full bg-error text-white text-xs font-bold border-2 border-white shadow-md">
                            {i + 1}
                        </div>
                    </Marker>
                ))}
            </MapGL>
        </div>
    );
}
