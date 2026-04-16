import Link from 'next/link';
import type { ReactNode } from 'react';

type TSearchItemProps = {
    href: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export function SearchItem({
    href,
    onClose,
    children,
    className = '',
    contentClassName = 'flex items-center gap-3 flex-1',
}: TSearchItemProps) {
    return (
        <Link
            href={href}
            className={`flex items-center bg-base-100 hover:bg-base-200 transition-colors p-4 border-b border-base-300 ${className}`}
            onClick={onClose}
        >
            <div className={contentClassName}>{children}</div>
        </Link>
    );
}
