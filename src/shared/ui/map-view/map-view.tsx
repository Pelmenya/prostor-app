'use client';

import { type FC } from 'react';
import MapGL, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

type TMapViewProps = {
    /** [latitude, longitude] — как в Яндекс Картах */
    coordinates: [number, number];
    zoom?: number;
    /** Если передан — маркер можно перетаскивать */
    onChangeCoordinates?: (coords: [number, number]) => void;
};

export const MapView: FC<TMapViewProps> = ({ coordinates, zoom = 17, onChangeCoordinates }) => {
    const [lat, lng] = coordinates;

    const handleDragEnd = (event: { lngLat: { lat: number; lng: number } }) => {
        onChangeCoordinates?.([event.lngLat.lat, event.lngLat.lng]);
    };

    return (
        <div className="border border-base-300 bg-base-100 rounded-box p-4 overflow-hidden max-w-full">
            <div className="w-full max-w-full overflow-hidden rounded-lg h-[250px]">
                <MapGL
                    initialViewState={{
                        longitude: lng,
                        latitude: lat,
                        zoom,
                    }}
                    mapStyle={MAP_STYLE}
                    attributionControl={false}
                >
                    <NavigationControl position="top-right" />
                    <Marker
                        longitude={lng}
                        latitude={lat}
                        draggable={!!onChangeCoordinates}
                        onDragEnd={onChangeCoordinates ? handleDragEnd : undefined}
                        color="#570df8"
                    />
                </MapGL>
            </div>
        </div>
    );
};
