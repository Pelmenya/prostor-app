import { FC, ReactNode } from 'react';
import { cn } from '@/shared/lib';

type TBaseProps = {
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
};

export const Base: FC<TBaseProps> = ({ children, className, onClick }) => (
    <div
        onClick={onClick}
        className={cn(
            'border border-base-300 bg-base-100 rounded-box py-4 flex items-center justify-center',
            className,
        )}
    >
        {children}
    </div>
);
