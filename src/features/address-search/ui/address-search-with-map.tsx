'use client';

import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { useAddressSuggestions, useAddressCoordinates } from '../api/address.api';
import type { TSuggestion } from '../model/types/t-suggestion';
import type { TFullGeoDataResponse } from '../model/types/t-full-geo-data-response';
import type { TCoordinates } from '../model/types/t-coordinates';

type TNullable<T> = T | null;

type TAddressSearchWithMapProps = {
    query: string;
    selectedAddress: TNullable<string>;
    coordinates: TNullable<TCoordinates>;
    isViewCoordinates?: boolean;
    zoom?: number;
    onQueryChange: (query: string) => void;
    onSelectAddress: (address: string) => void;
    onSelectSuggestion: (suggestion: TNullable<TSuggestion>) => void;
    onCoordinatesChange: (fullGeoData: TNullable<TFullGeoDataResponse>) => void;
    readOnly?: boolean;
};

export const AddressSearchWithMap: React.FC<TAddressSearchWithMapProps> = ({
    query,
    selectedAddress,
    coordinates,
    isViewCoordinates = true,
    onQueryChange,
    onSelectAddress,
    onSelectSuggestion,
    onCoordinatesChange,
    readOnly = false,
}) => {
    const { data: suggestionsData } = useAddressSuggestions(query);
    const suggestions = suggestionsData?.suggestions || [];

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Cleanup debounce при unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // --- Состояния для ручной коррекции и геокодера
    const [pendingSign, setPendingSign] = useState<string | null>(null);
    const [isManual, setIsManual] = useState(false);

    // --- Геокодер только по pendingSign
    const { data: fullGeoData } = useAddressCoordinates(pendingSign);

    // После геокодера обновляем координаты
    useEffect(() => {
        if (!isManual && fullGeoData?.coordinates) {
            onCoordinatesChange(fullGeoData);
            setPendingSign(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullGeoData]);

    // Сброс ручных координат при смене selectedAddress
    useEffect(() => {
        setIsManual(false);
    }, [selectedAddress]);

    // Автоскролл инпута
    useLayoutEffect(() => {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.scrollLeft = inputRef.current.scrollWidth;
            }
        }, 0);
    }, [query]);

    // Ввод текста с debounce
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onQueryChange(value);
        }, 300);
    };

    // Выбор подсказки: всё синхронно, потом геокодер
    const handleSelect = (value: string | null) => {
        if (!value) return;
        onQueryChange(value);
        onSelectAddress(value);
        const selectSuggestion = suggestions.find((item) => item.value === value);
        onSelectSuggestion(selectSuggestion ? { ...selectSuggestion } : null);

        setIsManual(false);
        onCoordinatesChange(null); // сбросить старые координаты

        // Уникальный ключ форсирует геокодер даже при повторном выборе того же адреса
        if (selectSuggestion?.sign) {
            setPendingSign(`${selectSuggestion.sign}_${Date.now()}`);
        }

        requestAnimationFrame(() => inputRef.current?.focus());
    };

    // Очистка поля
    const handleClear = () => {
        onQueryChange('');
        onSelectAddress('');
        onSelectSuggestion(null);
        onCoordinatesChange(null);
        setIsManual(false);
        setPendingSign(null);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
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
                                className="input input-primary w-full text-lg h-12 pl-4 pr-10 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all overflow-x-auto whitespace-nowrap"
                                style={{
                                    fontSize: '17px',
                                    minHeight: '48px',
                                }}
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
                                    <span className="text-xl leading-none">✕</span>
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

            {coordinates && (
                <div className="grid w-full">
                    {/* TODO: Добавить MapLibre компонент когда он будет готов */}
                    <div className="w-full h-48 bg-base-200 rounded-xl flex items-center justify-center text-base-content/40 text-sm">
                        Карта: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </div>
                    {isViewCoordinates && (
                        <p className="mt-2 text-sm">
                            Координаты: {coordinates.latitude + ', ' + coordinates.longitude}
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
