import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

type TCheckoutSectionProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

export function CheckoutSection({ title, children, className }: TCheckoutSectionProps) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <h4 className="text-lg font-semibold">{title}</h4>
            {children}
        </div>
    );
}
