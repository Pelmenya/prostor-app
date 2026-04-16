'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SearchModal } from '../search-modal/search-modal';

// Показываем кнопку поиска только на страницах каталога
function useShowSearch(): boolean {
    const pathname = usePathname();
    return pathname.startsWith('/catalog') || pathname.startsWith('/product') || pathname === '/';
}

export function SearchButton() {
    const [isOpen, setIsOpen] = useState(false);
    const showSearch = useShowSearch();

    if (!showSearch) return null;

    return (
        <>
            <button
                className="size-10 flex items-center justify-center cursor-pointer hover:opacity-80"
                onClick={() => setIsOpen(true)}
                aria-label="Поиск товаров"
            >
                <MagnifyingGlassIcon className="size-5" />
            </button>

            <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
