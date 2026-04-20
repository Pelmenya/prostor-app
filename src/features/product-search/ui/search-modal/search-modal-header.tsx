'use client';

import { type RefObject } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { IconButton } from '@/shared/ui';

type TSearchModalHeaderProps = {
    innerQuery: string;
    inputRef: RefObject<HTMLInputElement | null>;
    countData: { count: number } | undefined;
    showCount: boolean;
    onClose: () => void;
    onClear: () => void;
    onChange: (value: string) => void;
};

export function SearchModalHeader({
    innerQuery,
    inputRef,
    countData,
    showCount,
    onClose,
    onClear,
    onChange,
}: TSearchModalHeaderProps) {
    return (
        <header className="shrink-0 bg-base-100 border-b border-base-content/10">
            <div className="navbar px-2 py-3 border-b border-base-content/10">
                <div className="navbar-start">
                    <IconButton onClick={onClose} aria-label="Закрыть поиск">
                        <ArrowLeftIcon className="size-5" />
                    </IconButton>
                </div>
                <div className="navbar-center">
                    <p className="text-lg font-bold">Поиск товаров</p>
                </div>
                <div className="navbar-end" />
            </div>

            <div className="flex justify-center p-4">
                <label className="input w-full lg:max-w-150">
                    <MagnifyingGlassIcon className="size-3.5 shrink-0 text-base-content/50" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={innerQuery}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Введите название товара"
                        autoComplete="off"
                        data-autofocus
                    />
                    {innerQuery && (
                        <button type="button" onClick={onClear} aria-label="Очистить">
                            <XMarkIcon className="size-3.5" />
                        </button>
                    )}
                </label>
            </div>

            {showCount && (
                <div className="px-4 pb-3">
                    {countData && countData.count > 0 ? (
                        <p className="text-center text-sm opacity-70">Найдено {countData.count}</p>
                    ) : (
                        <p className="text-center text-sm text-primary opacity-70">
                            Ничего не найдено
                        </p>
                    )}
                </div>
            )}
        </header>
    );
}
