import { cn } from '@/shared/lib';

type TCardWrapperVariant = 'default' | 'compact' | 'no-gap';

type TCardWrapperProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: TCardWrapperVariant;
    outlined?: boolean;
    className?: string;
};

export function CardWrapper({
    children,
    onClick,
    variant = 'default',
    outlined = false,
    className,
}: TCardWrapperProps) {
    return (
        <article
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') onClick();
                      }
                    : undefined
            }
            className={cn(
                'flex items-center bg-base-100 rounded-2xl',
                outlined ? 'border border-base-300' : 'shadow-sm',
                variant === 'compact' && 'gap-2 p-2',
                variant === 'default' && 'gap-4 p-4',
                variant === 'no-gap' && 'gap-0 p-4',
                onClick && 'cursor-pointer hover:bg-base-200',
                className,
            )}
        >
            {children}
        </article>
    );
}
