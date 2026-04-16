'use client';

import { useReducer, useEffect, useRef, useCallback } from 'react';

type TState<T> = {
    items: T[];
    cursor: string | undefined;
    hasMore: boolean;
};

type TAction<T> =
    | { type: 'RESET' }
    | { type: 'APPEND'; items: T[]; nextCursor: string | undefined; hasMore: boolean };

function createInitialState<T>(): TState<T> {
    return { items: [], cursor: undefined, hasMore: true };
}

function reducer<T extends { id: string | number }>(
    state: TState<T>,
    action: TAction<T>,
): TState<T> {
    switch (action.type) {
        case 'RESET':
            return createInitialState<T>();
        case 'APPEND': {
            if (state.items.length === 0) {
                return { items: action.items, cursor: action.nextCursor, hasMore: action.hasMore };
            }
            const existingIds = new Set(state.items.map((item) => item.id));
            const unique = action.items.filter((item) => !existingIds.has(item.id));
            return {
                items: [...state.items, ...unique],
                cursor: action.nextCursor,
                hasMore: action.hasMore,
            };
        }
        default:
            return state;
    }
}

/**
 * Универсальный хук для cursor-based пагинации.
 *
 * @template T - тип элементов (должен иметь поле `id`)
 * @param deps - зависимости, при изменении которых сбрасывается пагинация
 */
export function usePagination<T extends { id: string | number }>(deps: unknown[] = []) {
    const [state, dispatch] = useReducer(reducer<T>, undefined, createInitialState<T>);

    const nextCursorRef = useRef<string | undefined>(undefined);
    const hasMoreRef = useRef(true);

    // Сброс при изменении зависимостей через dispatch (не setState)

    useEffect(() => {
        dispatch({ type: 'RESET' });
        nextCursorRef.current = undefined;
        hasMoreRef.current = true;
    }, deps);

    const handleData = useCallback(
        (newItems: T[] | undefined, nextCursor: string | undefined, hasMoreData: boolean) => {
            if (newItems) {
                dispatch({ type: 'APPEND', items: newItems, nextCursor, hasMore: hasMoreData });
                nextCursorRef.current = nextCursor;
                hasMoreRef.current = hasMoreData;
            }
        },
        [],
    );

    const loadMore = useCallback(() => {
        if (hasMoreRef.current && nextCursorRef.current) {
            dispatch({
                type: 'APPEND',
                items: [],
                nextCursor: nextCursorRef.current,
                hasMore: true,
            });
        }
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
        nextCursorRef.current = undefined;
        hasMoreRef.current = true;
    }, []);

    return {
        items: state.items,
        cursor: state.cursor,
        hasMore: state.hasMore,
        handleData,
        loadMore,
        reset,
    };
}
