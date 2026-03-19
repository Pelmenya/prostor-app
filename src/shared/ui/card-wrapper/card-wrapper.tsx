import { cn } from '@/shared/lib/cn';

type TCardWrapperVariant = 'default' | 'compact' | 'no-gap';

type TCardWrapperProps = {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: TCardWrapperVariant;
    className?: string;
};

const VARIANT_STYLES: Record<TCardWrapperVariant, string> = {
    default: 'flex flex-col gap-3 p-3',
    compact: 'flex flex-row gap-3 p-3 items-center',
    'no-gap': 'flex flex-col',
};

export function CardWrapper({
    children,
    onClick,
    variant = 'default',
    className,
}: TCardWrapperProps) {
    return (
        <div
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
                'rounded-2xl bg-base-100 shadow transition-shadow',
                onClick && 'cursor-pointer hover:shadow-md active:shadow-sm',
                VARIANT_STYLES[variant],
                className,
            )}
        >
            {children}
        </div>
    );
}
