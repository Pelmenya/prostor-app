'use client';

import { useState, useEffect } from 'react';

export function useDebouncedValue(value: string, delay = 300): string {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value.trim()), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
