import { cn } from '@/shared/lib';

type TPageContainerBg = 'bg-base-100' | 'bg-base-200' | 'bg-base-300';

type TPageContainerProps = {
    bg?: TPageContainerBg;
    className?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

export function PageContainer({
    bg = 'bg-base-300',
    className,
    children,
    footer,
}: TPageContainerProps) {
    if (footer) {
        return (
            <div className={cn('flex flex-col min-h-full', bg)}>
                <div className={cn('flex-1 page-container', className)}>{children}</div>
                {footer}
            </div>
        );
    }

    return <div className={cn('min-h-full page-container', bg, className)}>{children}</div>;
}
