import type { ReactNode } from 'react';
import { CardBadge } from '@/shared/ui';

type TCardBadgeVariant = 'product' | 'service' | 'installation' | 'maintenance';

type TCartCardWrapperProps = {
    variant: TCardBadgeVariant;
    subtitle?: string;
    children: ReactNode;
};

export function CartCardWrapper({ variant, subtitle, children }: TCartCardWrapperProps) {
    return (
        <div className="relative flex flex-col gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
            <CardBadge variant={variant} />
            {subtitle && (
                <div className="-mx-4 -mt-4 px-4 py-3 bg-base-200 border-b border-base-content/10 rounded-2xl">
                    <h3 className="text-sm leading-4 line-clamp-3">{subtitle}</h3>
                </div>
            )}
            {children}
        </div>
    );
}
