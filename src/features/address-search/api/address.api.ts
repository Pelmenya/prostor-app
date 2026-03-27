import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { TSuggestionAddressResponseData } from '../model/types/t-suggestion-address-response-data';
import type { TFullGeoDataResponse } from '../model/types/t-full-geo-data-response';

export const addressKeys = {
    suggestions: (q: string) => ['address', 'suggestions', q] as const,
    coordinates: (sign: string) => ['address', 'coordinates', sign] as const,
};

export function useAddressSuggestions(q: string) {
    return useQuery({
        queryKey: addressKeys.suggestions(q),
        queryFn: () =>
            apiClient<TSuggestionAddressResponseData>(
                `/proxy/suggest/address?q=${encodeURIComponent(q)}`,
            ),
        enabled: q.length > 0,
        staleTime: 10_000,
    });
}

export function useAddressCoordinates(sign: string | null) {
    return useQuery({
        queryKey: addressKeys.coordinates(sign ?? ''),
        queryFn: () =>
            apiClient<TFullGeoDataResponse>(`/proxy/geocode?sign=${encodeURIComponent(sign!)}`),
        enabled: Boolean(sign),
        staleTime: 60_000,
    });
}
