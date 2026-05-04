'use client';

import { useRef, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useGetStores } from '../../api/store.api';
import type { TStore } from '../../model/t-store';

type TStoreSearchProps = {
    value: string | null;
    onChange: (storeId: string | null) => void;
};

export function StoreSearch({ value, onChange }: TStoreSearchProps) {
    const { data: stores = [], isLoading } = useGetStores();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const activeStores = stores.filter((s) => !s.archived);

    const selectedStore = activeStores.find((s) => s.id === value) ?? null;

    const filteredStores = query.trim()
        ? activeStores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        : activeStores;

    function handleSelect(store: TStore | null) {
        onChange(store?.id ?? null);
        setQuery('');
    }

    function handleClear() {
        onChange(null);
        setQuery('');
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    return (
        <div className="relative w-full">
            <Combobox value={selectedStore} onChange={handleSelect}>
                <div className="relative">
                    <ComboboxInput
                        ref={inputRef}
                        className="input input-bordered w-full pr-10"
                        displayValue={(store: TStore | null) => store?.name ?? ''}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                            isLoading ? 'Загрузка складов...' : 'Начните вводить для поиска'
                        }
                        autoComplete="off"
                        disabled={isLoading}
                    />
                    {(query || value) && (
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleClear}
                            aria-label="Очистить"
                            tabIndex={-1}
                        >
                            <XMarkIcon className="size-4" />
                        </button>
                    )}
                </div>

                {filteredStores.length > 0 && (
                    <ComboboxOptions className="absolute left-0 z-30 bg-base-100 border border-base-300 rounded-xl shadow-lg max-h-60 mt-1 w-full overflow-auto">
                        {filteredStores.map((store) => (
                            <ComboboxOption
                                key={store.id}
                                value={store}
                                className="cursor-pointer select-none"
                            >
                                {({ focus, selected }) => (
                                    <div
                                        className={`px-4 py-3 text-sm ${focus ? 'bg-primary/10 text-primary' : ''} ${selected ? 'bg-primary/20' : ''}`}
                                    >
                                        <p className="font-medium">{store.name}</p>
                                        {store.address && (
                                            <p className="text-xs text-base-content/60 mt-0.5">
                                                {store.address}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </ComboboxOption>
                        ))}
                    </ComboboxOptions>
                )}
            </Combobox>
        </div>
    );
}
