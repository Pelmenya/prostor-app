import { cn } from '@/shared/lib';

type TPageContainerBg = 'bg-base-100' | 'bg-base-200' | 'bg-base-300';

type TPageContainerProps = {
    bg?: TPageContainerBg;
    className?: string;
    children: React.ReactNode;
};

export function PageContainer({ bg = 'bg-base-300', className, children }: TPageContainerProps) {
    return <div className={cn('min-h-full page-container', bg, className)}>{children}</div>;
}
