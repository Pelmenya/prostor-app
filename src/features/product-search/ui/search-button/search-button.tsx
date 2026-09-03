'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/shared/ui';
import { useProductSearchStore } from '../../model/product-search.store';

// Только для (web) layout — в miniapp/dashboard поиск недоступен
export function SearchButton() {
    const open = useProductSearchStore((s) => s.open);

    return (
        <IconButton onClick={open} aria-label="Поиск товаров">
            <MagnifyingGlassIcon className="size-5" />
        </IconButton>
    );
}
