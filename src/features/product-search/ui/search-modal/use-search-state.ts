'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/shared/lib';
import { useProductSearchStore } from '../../model/product-search.store';

export function useSearchState() {
    const [innerQuery, setInnerQuery] = useState('');
    const query = useDebouncedValue(innerQuery).trim();
    const close = useProductSearchStore((s) => s.close);

    const handleClose = () => {
        setInnerQuery('');
        close();
    };

    const handleClear = () => setInnerQuery('');

    return { innerQuery, setInnerQuery, query, handleClose, handleClear };
}
