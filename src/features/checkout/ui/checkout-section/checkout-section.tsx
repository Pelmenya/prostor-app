import type { ReactNode } from 'react';

type TCheckoutSectionProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

export function CheckoutSection({ title, children, className }: TCheckoutSectionProps) {
    return (
        <div className={`flex flex-col gap-3 ${className ?? ''}`}>
            <h4 className="text-lg font-semibold">{title}</h4>
            {children}
        </div>
    );
}
