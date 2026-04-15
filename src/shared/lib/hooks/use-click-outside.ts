'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Закрывает элемент по клику/тапу вне переданных рефов и по нажатию Escape.
 * @param refs    - рефы контейнеров, клик внутри которых НЕ закрывает элемент
 * @param handler - колбэк закрытия
 * @param enabled - активен ли обработчик (по умолчанию true)
 */
export function useClickOutside(
    refs: Array<RefObject<HTMLElement | null>>,
    handler: () => void,
    enabled = true,
) {
    useEffect(() => {
        if (!enabled) return;

        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target as Node;
            const isOutside = refs.every((ref) => !ref.current?.contains(target));
            if (isOutside) handler();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handler();
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [refs, handler, enabled]);
}
