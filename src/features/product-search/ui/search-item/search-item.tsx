import Link from 'next/link';
import type { ReactNode } from 'react';

type TSearchItemProps = {
    href: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
};

export function SearchItem({ href, onClose, children, className = '' }: TSearchItemProps) {
    const handleClick = () => {
        // microtask чтобы Link успел начать навигацию до закрытия модалки
        void Promise.resolve().then(onClose);
    };

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 bg-base-100 hover:bg-base-200 transition-colors p-4 border-b border-base-300 ${className}`}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
}
