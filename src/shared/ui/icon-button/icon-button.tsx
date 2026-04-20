import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type TIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, TIconButtonProps>(
    ({ className = '', children, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            className={`size-10 flex items-center justify-center cursor-pointer hover:opacity-80 ${className}`}
            {...props}
        >
            {children}
        </button>
    ),
);

IconButton.displayName = 'IconButton';
