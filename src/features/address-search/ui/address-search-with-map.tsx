'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FC } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MapView } from '@/shared/ui';
import { useAddressSuggestions, fetchCoordinates } from '../api/address.api';
import type { TSuggestion } from '../model/types/t-suggestion';
import type { TFullGeoDataResponse } from '../model/types/t-full-geo-data-response';
import type { TCoordinates } from '../model/types/t-coordinates';

type TAddressSearchWithMapProps = {
    query: string;
    selectedAddress: string | null;
    coordinates: TCoordinates | null;
    isViewCoordinates?: boolean;
    onQueryChange: (query: string) => void;
    onSelectAddress: (address: string) => void;
    onSelectSuggestion: (suggestion: TSuggestion | null) => void;
    onCoordinatesChange: (fullGeoData: TFullGeoDataResponse | null) => void;
    /** Ручная коррекция координат (перетаскивание маркера на карте) */
    onDragCoordinates?: (coords: TCoordinates) => void;
    readOnly?: boolean;
};

export const AddressSearchWithMap: FC<TAddressSearchWithMapProps> = ({
    query,
    selectedAddress,
    coordinates,
    isViewCoordinates = true,
    onQueryChange,
    onSelectAddress,
    onSelectSuggestion,
    onCoordinatesChange,
    onDragCoordinates,
    readOnly = false,
}) => {
    const { data: suggestionsData } = useAddressSuggestions(query);
    const suggestions = suggestionsData?.suggestions || [];

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Cleanup debounce при unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Автоскролл инпута
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.scrollLeft = inputRef.current.scrollWidth;
        }
    }, [query]);

    // Ввод текста с debounce
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onQueryChange(value);
        }, 300);
    };

    // Выбор подсказки → геокодирование через прямой fetch (без useState/useEffect)
    const handleSelect = async (value: string | null) => {
        if (!value) return;
        onQueryChange(value);
        onSelectAddress(value);
        const selectSuggestion = suggestions.find((item) => item.value === value);
        onSelectSuggestion(selectSuggestion ? { ...selectSuggestion } : null);
        onCoordinatesChange(null);

        if (selectSuggestion?.sign) {
            setIsGeocoding(true);
            try {
                const fullGeoData = await fetchCoordinates(selectSuggestion.sign);
                onCoordinatesChange(fullGeoData);
            } catch {
                // Геокодирование не удалось — координаты останутся null
            } finally {
                setIsGeocoding(false);
            }
        }

        requestAnimationFrame(() => inputRef.current?.focus());
    };

    // Очистка поля
    const handleClear = () => {
        onQueryChange('');
        onSelectAddress('');
        onSelectSuggestion(null);
        onCoordinatesChange(null);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    return (
        <div className="w-full flex flex-col gap-4 lg:gap-6">
            {!readOnly && (
                <div className="relative w-full">
                    <Combobox value={query} onChange={handleSelect}>
                        <div className="relative">
                            <ComboboxInput
                                ref={inputRef}
                                onChange={handleChange}
                                className="input input-primary w-full text-[17px] min-h-12 pl-4 pr-10 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all overflow-x-auto whitespace-nowrap"
                                placeholder="Введите адрес полностью"
                                autoComplete="off"
                                inputMode="text"
                            />
                            {query && (
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleClear}
                                    aria-label="Очистить"
                                    tabIndex={-1}
                                >
                                    <XMarkIcon className="size-5" />
                                </button>
                            )}
                        </div>
                        {query && suggestions.length === 0 && (
                            <ComboboxOptions className="absolute left-0 z-30 bg-base-100 border border-primary rounded-xl shadow-lg max-h-60 mt-1 w-full overflow-auto">
                                <div className="p-3">Нет подходящей подсказки</div>
                            </ComboboxOptions>
                        )}
                        {suggestions.length > 0 && (
                            <ComboboxOptions className="absolute left-0 z-30 bg-base-100 border border-primary rounded-xl shadow-lg max-h-60 mt-1 w-full overflow-auto">
                                {suggestions.map((suggestion) => (
                                    <ComboboxOption
                                        key={suggestion.sign}
                                        value={suggestion.value}
                                        className="cursor-pointer select-none relative"
                                    >
                                        {({ focus, selected }) => (
                                            <span
                                                className={`block px-4 py-3 text-base
                                                    ${focus ? 'bg-primary/10 text-primary font-semibold' : ''}
                                                    ${selected ? 'bg-primary/20' : ''}
                                                    whitespace-normal break-words
                                                `}
                                            >
                                                {suggestion.value}
                                            </span>
                                        )}
                                    </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                        )}
                    </Combobox>
                </div>
            )}

            {isGeocoding && (
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <span className="loading loading-spinner loading-xs" />
                    Определяем координаты...
                </div>
            )}

            {coordinates && (
                <div className="grid w-full">
                    <MapView
                        coordinates={[coordinates.latitude, coordinates.longitude]}
                        onChangeCoordinates={
                            onDragCoordinates
                                ? (coords) =>
                                      onDragCoordinates({
                                          latitude: coords[0],
                                          longitude: coords[1],
                                      })
                                : undefined
                        }
                    />
                    {isViewCoordinates && (
                        <p className="mt-2 text-sm">
                            {`Координаты: ${coordinates.latitude}, ${coordinates.longitude}`}
                        </p>
                    )}
                </div>
            )}

            <div className="w-full">
                {query && query.length > 0 && (
                    <span className="block text-xs break-all">Адрес: {query}</span>
                )}
            </div>
        </div>
    );
};
