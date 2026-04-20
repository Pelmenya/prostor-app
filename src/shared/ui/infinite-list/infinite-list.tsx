'use client';

import { type ReactNode, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

type TInfiniteListProps<T> = {
    items: T[];
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    renderItem: (item: T, index: number) => ReactNode;
    keyExtractor: (item: T, index: number) => string | number;
    className?: string;
    itemClassName?: string;
    loadingComponent?: ReactNode;
    emptyComponent?: ReactNode;
    isError?: boolean;
    errorComponent?: ReactNode;
};

export function InfiniteList<T>({
    items,
    hasMore,
    isLoading,
    onLoadMore,
    renderItem,
    keyExtractor,
    className = 'flex flex-col',
    itemClassName = '',
    loadingComponent,
    emptyComponent,
    isError,
    errorComponent,
}: TInfiniteListProps<T>) {
    const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            onLoadMore();
        }
    }, [inView, hasMore, isLoading, onLoadMore]);

    if (isError) {
        return (
            <>{errorComponent ?? <p className="text-center text-error py-8">Ошибка загрузки</p>}</>
        );
    }

    if (!items.length && isLoading) {
        return (
            <>
                {loadingComponent ?? (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <span className="loading loading-spinner loading-md" />
                        <span className="text-sm text-base-content/60">Загрузка...</span>
                    </div>
                )}
            </>
        );
    }

    if (!items.length) {
        return <>{emptyComponent}</>;
    }

    return (
        <div>
            <ul className={className}>
                {items.map((item, index) => (
                    <li key={keyExtractor(item, index)} className={itemClassName}>
                        {renderItem(item, index)}
                    </li>
                ))}
            </ul>

            {hasMore && (
                <div ref={ref} className="py-8 text-center min-h-[100px]">
                    {isLoading ? (
                        <>
                            {loadingComponent ?? (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="loading loading-spinner loading-md" />
                                    <span className="text-sm text-base-content/60">
                                        Загрузка...
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-4" />
                    )}
                </div>
            )}
        </div>
    );
}

export type { TInfiniteListProps };
