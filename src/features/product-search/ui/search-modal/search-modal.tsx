'use client';

import { type FC, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { useProductSearchPaginated, useProductSearchCount } from '@/entities/product';
import type { TProduct } from '@/entities/product';
import { SearchList } from '../search-list/search-list';

type TSearchModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const SearchModal: FC<TSearchModalProps> = ({ isOpen, onClose }) => {
    const [innerQuery, setInnerQuery] = useState('');
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Сброс состояния при закрытии — делаем через обёртку, не useEffect
    const handleClose = useCallback(() => {
        setInnerQuery('');
        setQuery('');
        onClose();
    }, [onClose]);

    // Debounce через useEffect без lodash
    useEffect(() => {
        const timer = setTimeout(() => setQuery(innerQuery.trim()), 300);
        return () => clearTimeout(timer);
    }, [innerQuery]);

    // Автофокус при открытии (только DOM-взаимодействие)
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
        useProductSearchPaginated(query);

    const { data: countData } = useProductSearchCount(query);

    const items = useMemo<TProduct[]>(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data],
    );

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetching) {
            void fetchNextPage();
        }
    }, [hasNextPage, isFetching, fetchNextPage]);

    const handleClear = () => {
        setInnerQuery('');
        setQuery('');
        inputRef.current?.focus();
    };

    const showCount = query.length >= 2 && !isLoading && !isFetching;

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-10000">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 hidden lg:block transition-opacity duration-300 ease-out data-closed:opacity-0"
            />

            <div className="fixed inset-0 lg:flex lg:justify-end">
                <DialogPanel
                    transition
                    className="fixed inset-0 flex flex-col h-dvh bg-base-300 lg:relative lg:max-h-163.5 lg:w-full lg:shadow-xl lg:rounded-b-2xl lg:overflow-hidden transition duration-300 ease-out data-closed:lg:-translate-y-full"
                >
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <header className="shrink-0 bg-base-100 border-b border-base-content/10">
                            <div className="navbar px-2 py-3 border-b border-base-content/10">
                                <div className="navbar-start">
                                    <button
                                        onClick={handleClose}
                                        className="size-10 flex items-center justify-center cursor-pointer hover:opacity-80"
                                        aria-label="Назад"
                                    >
                                        <ArrowLeftIcon className="size-5" />
                                    </button>
                                </div>
                                <div className="navbar-center">
                                    <p className="text-lg font-bold">Поиск товаров</p>
                                </div>
                                <div className="navbar-end" />
                            </div>

                            <div className="flex justify-center p-4">
                                <div className="join w-full lg:max-w-150">
                                    <div className="grow">
                                        <label className="input join-item w-full">
                                            <MagnifyingGlassIcon className="size-3.5 shrink-0 text-base-content/50" />
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={innerQuery}
                                                onChange={(e) => setInnerQuery(e.target.value)}
                                                placeholder="Введите название товара"
                                                autoComplete="off"
                                            />
                                            {innerQuery && (
                                                <button
                                                    type="button"
                                                    onClick={handleClear}
                                                    aria-label="Очистить"
                                                >
                                                    <XMarkIcon className="size-3.5" />
                                                </button>
                                            )}
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary join-item z-1"
                                        onClick={() => setQuery(innerQuery.trim())}
                                    >
                                        Поиск
                                    </button>
                                </div>
                            </div>

                            {showCount && (
                                <div className="px-4 pb-3">
                                    {countData && countData.count > 0 ? (
                                        <p className="text-center text-sm opacity-70">
                                            Найдено {countData.count}
                                        </p>
                                    ) : (
                                        <p className="text-center text-sm text-primary opacity-70">
                                            Ничего не найдено
                                        </p>
                                    )}
                                </div>
                            )}
                        </header>

                        <main className="flex-1 overflow-y-auto">
                            {query.length >= 2 && (
                                <SearchList
                                    items={items}
                                    hasMore={!!hasNextPage}
                                    isLoading={isLoading}
                                    isFetching={isFetching}
                                    onLoadMore={handleLoadMore}
                                    onClose={handleClose}
                                />
                            )}
                        </main>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};
