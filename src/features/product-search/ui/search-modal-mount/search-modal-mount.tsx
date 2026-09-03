'use client';

import dynamic from 'next/dynamic';
import { useProductSearchStore } from '../../model/product-search.store';

const SearchModal = dynamic(
    () => import('../search-modal/search-modal').then((m) => ({ default: m.SearchModal })),
    { ssr: false },
);

export function SearchModalMount() {
    const hasEverOpened = useProductSearchStore((s) => s.hasEverOpened);
    if (!hasEverOpened) return null;
    return <SearchModal />;
}
