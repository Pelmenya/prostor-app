'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export type TBreadcrumb = {
    name: string;
    path?: string;
};

type TBreadcrumbsProps = {
    items: TBreadcrumb[];
    isLoading: boolean;
};

const SKELETON_WIDTHS = ['w-16', 'w-20', 'w-24'] as const;

function BreadcrumbSkeleton() {
    return (
        <>
            {SKELETON_WIDTHS.map((width, index) => (
                <li key={index}>
                    <div className={`skeleton h-4 ${width} rounded`} />
                </li>
            ))}
        </>
    );
}

function BreadcrumbItem({
    item,
    isLast,
    lastItemRef,
}: {
    item: TBreadcrumb;
    isLast: boolean;
    lastItemRef: React.RefObject<HTMLLIElement | null>;
}) {
    return (
        <li ref={isLast ? lastItemRef : null}>
            {item.path ? <Link href={item.path}>{item.name}</Link> : <span>{item.name}</span>}
        </li>
    );
}

export function Breadcrumbs({ items, isLoading }: TBreadcrumbsProps) {
    const lastItemRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (lastItemRef.current) {
            lastItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'end',
            });
        }
    }, [items]);

    return (
        <nav aria-label="Хлебные крошки" className="breadcrumbs p-0 text-sm scrollbar-hidden">
            <ul>
                {isLoading ? (
                    <BreadcrumbSkeleton />
                ) : (
                    items.map((item, index) => (
                        <BreadcrumbItem
                            key={item.path ?? index}
                            item={item}
                            isLast={index === items.length - 1}
                            lastItemRef={lastItemRef}
                        />
                    ))
                )}
            </ul>
        </nav>
    );
}
