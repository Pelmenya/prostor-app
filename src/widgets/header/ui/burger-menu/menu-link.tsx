'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';

type TMenuLinkProps = {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
};

export function MenuLink({ href, icon: Icon, label, onClick }: TMenuLinkProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-200 transition-colors"
        >
            <Icon className="size-5 shrink-0 text-base-content/70" />
            <span className="text-sm">{label}</span>
        </Link>
    );
}
