'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type TSearchItemProps = {
    href: string;
    onClose: () => void;
    children: ReactNode;
};

export function SearchItem({ href, onClose, children }: TSearchItemProps) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 bg-base-100 hover:bg-base-200 transition-colors p-4 border-b border-base-300"
            onClick={onClose}
        >
            {children}
        </Link>
    );
}
