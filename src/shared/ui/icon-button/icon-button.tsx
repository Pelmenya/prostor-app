import { type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';

type TIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    ref?: Ref<HTMLButtonElement>;
};

export function IconButton({ className = '', children, ref, ...props }: TIconButtonProps) {
    return (
        <button
            ref={ref}
            type="button"
            className={`size-10 flex items-center justify-center cursor-pointer hover:opacity-80 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
