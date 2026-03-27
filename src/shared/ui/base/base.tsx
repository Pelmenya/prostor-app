import { type FC, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib';

type TBaseProps = {
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
};

export const Base: FC<TBaseProps> = ({ children, className, onClick }) => {
    const handleKeyDown = onClick
        ? (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
          }
        : undefined;

    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={handleKeyDown}
            className={cn(
                'border border-base-300 bg-base-100 rounded-box py-4 flex items-center justify-center',
                className,
            )}
        >
            {children}
        </div>
    );
};
