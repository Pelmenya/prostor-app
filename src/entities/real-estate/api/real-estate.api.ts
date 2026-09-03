import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import type {
    TRealEstate,
    TCreateRealEstate,
    TUpdateRealEstate,
    TRetailStoreWithRouteInfo,
    TInventoryCheckResponse,
} from '@/shared/model';

export const realEstateKeys = {
    all: ['real-estate'] as const,
    detail: (id: number) => ['real-estate', id] as const,
    nearestStores: (realEstateId: number) =>
        ['real-estate', 'nearest-stores', realEstateId] as const,
    routePolyline: (realEstateId: number, to: [number, number]) =>
        ['real-estate', 'route-polyline', realEstateId, to[0], to[1]] as const,
};

export type TRoutePolylineResponse = {
    routes: Array<{
        geometry: {
            coordinates: Array<[number, number]>;
        };
    }>;
};

export function useRealEstates() {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: realEstateKeys.all,
        queryFn: () => api<TRealEstate[]>('/real-estate'),
    });
}

export function useRealEstate(id: number) {
    const api = useApi();

    return useSuspenseQuery({
        queryKey: realEstateKeys.detail(id),
        queryFn: () => api<TRealEstate>(`/real-estate/${id}`),
    });
}

export function useCreateRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TCreateRealEstate) =>
            api<TRealEstate>('/real-estate', { method: 'POST', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
        },
    });
}

export function useUpdateRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TUpdateRealEstate }) =>
            api<TRealEstate>(`/real-estate/${id}`, { method: 'PUT', body: data }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
            queryClient.invalidateQueries({ queryKey: realEstateKeys.detail(id) });
        },
    });
}

export function useDeleteRealEstate() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            api<{ success: boolean }>(`/real-estate/${id}`, { method: 'DELETE' }),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: realEstateKeys.all });
            queryClient.removeQueries({ queryKey: realEstateKeys.detail(id) });
        },
    });
}

type TNearestRetailStoresParams = {
    realEstateId: number;
    limit?: number;
    cartItems?: { productId: string; count: number }[];
};

type TRoutePolylineParams = {
    realEstateId: number;
    /** `[lng, lat]` — формат maplibre/GeoJSON. */
    to: [number, number];
};

/**
 * Backend GET /real-estate/:id/route-polyline?to=lng,lat — строит маршрут
 * OSRM/Mapbox от объекта до точки. Возвращает первый route с geometry.coordinates
 * в формате [lng, lat][]. Используется в water-map для рендера polyline маршрута
 * от объекта к точке продаж/приёма анализа.
 */
export function useRoutePolyline(params: TRoutePolylineParams | null) {
    const api = useApi();
    return useQuery({
        queryKey: params
            ? realEstateKeys.routePolyline(params.realEstateId, params.to)
            : ['real-estate', 'route-polyline', null],
        queryFn: () => {
            const { realEstateId, to } = params!;
            return api<TRoutePolylineResponse>(
                `/real-estate/${realEstateId}/route-polyline?to=${to[0]},${to[1]}`,
            );
        },
        enabled: params !== null,
        staleTime: 5 * 60 * 1000,
    });
}

export function useNearestRetailStores(params: TNearestRetailStoresParams | null) {
    const api = useApi();

    return useQuery({
        queryKey: params
            ? [...realEstateKeys.nearestStores(params.realEstateId), params.cartItems ?? []]
            : ['real-estate', 'nearest-stores', null],
        queryFn: () => {
            const { realEstateId, limit = 10, cartItems } = params!;
            const search = new URLSearchParams({ limit: String(limit) });
            if (cartItems?.length) {
                search.set('cartItems', JSON.stringify(cartItems));
            }
            return api<TRetailStoreWithRouteInfo[]>(
                `/real-estate/${realEstateId}/retail-stores?${search}`,
            );
        },
        enabled: params !== null,
    });
}

type TNearestRetailStoresByCoordsParams = {
    lat: number;
    lon: number;
    limit?: number;
    cartItems?: { productId: string; count: number }[];
};

/**
 * Public endpoint `GET /retail-stores/nearest?lat=&lon=&limit=&cartItems=` —
 * ближайшие точки продаж к произвольным координатам без real-estate.
 * Работает для гостей и pin'ов от геолокации/manual click.
 */
export function useNearestRetailStoresByCoords(params: TNearestRetailStoresByCoordsParams | null) {
    const api = useApi();
    return useQuery({
        queryKey: params
            ? [
                  'retail-stores',
                  'nearest-by-coords',
                  params.lat,
                  params.lon,
                  params.limit ?? 10,
                  params.cartItems ?? [],
              ]
            : ['retail-stores', 'nearest-by-coords', null],
        queryFn: () => {
            const { lat, lon, limit = 10, cartItems } = params!;
            const search = new URLSearchParams({
                lat: String(lat),
                lon: String(lon),
                limit: String(limit),
            });
            if (cartItems?.length) {
                search.set('cartItems', JSON.stringify(cartItems));
            }
            return api<TRetailStoreWithRouteInfo[]>(`/retail-stores/nearest?${search}`);
        },
        enabled: params !== null,
    });
}

type TRoutePolylineByCoordsParams = {
    /** `[lng, lat]` — точка отправления. */
    from: [number, number];
    /** `[lng, lat]` — точка назначения. */
    to: [number, number];
};

type TInventoryCheckParams = {
    /** МойСклад storeId точки продаж (поле `id` из TRetailStoreWithRouteInfo). */
    storeMoySkladId: string;
    items: Array<{ productId: string; count: number; productName?: string }>;
};

/**
 * Public endpoint `POST /retail-stores/:id/inventory-check` — детализированная
 * проверка наличия items из cart в конкретной точке продаж. Для V2 StorePopup
 * tab «Магазин · 12 из 14 в наличии».
 *
 * Body shape `{ items: [{productId, count, productName?}] }`. enabled = items
 * не пустой, иначе бэк отдаст пустой ответ а query будет шуметь.
 */
export function useInventoryCheck(params: TInventoryCheckParams | null) {
    const api = useApi();
    return useQuery({
        queryKey: params
            ? ['retail-stores', 'inventory-check', params.storeMoySkladId, params.items]
            : ['retail-stores', 'inventory-check', null],
        queryFn: () => {
            const { storeMoySkladId, items } = params!;
            return api<TInventoryCheckResponse>(
                `/retail-stores/${encodeURIComponent(storeMoySkladId)}/inventory-check`,
                { method: 'POST', body: { items } },
            );
        },
        enabled: params !== null && params.items.length > 0,
        staleTime: 60 * 1000,
    });
}

/**
 * Public endpoint `GET /retail-stores/route-polyline?from=lng,lat&to=lng,lat`.
 * OSRM-маршрут между двумя произвольными координатами. Используется для
 * рендера polyline на water-map от любого pin'а до точки продаж.
 */
export function useRoutePolylineByCoords(params: TRoutePolylineByCoordsParams | null) {
    const api = useApi();
    return useQuery({
        queryKey: params
            ? [
                  'retail-stores',
                  'route-polyline',
                  params.from[0],
                  params.from[1],
                  params.to[0],
                  params.to[1],
              ]
            : ['retail-stores', 'route-polyline', null],
        queryFn: () => {
            const { from, to } = params!;
            return api<TRoutePolylineResponse>(
                `/retail-stores/route-polyline?from=${from[0]},${from[1]}&to=${to[0]},${to[1]}`,
            );
        },
        enabled: params !== null,
        staleTime: 5 * 60 * 1000,
    });
}
