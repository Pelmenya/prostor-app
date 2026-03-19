import { cn } from '@/shared/lib/cn';

type TPageContainerBg = 'bg-base-100' | 'bg-base-200' | 'bg-base-300';

type TPageContainerProps = {
    bg?: TPageContainerBg;
    className?: string;
    children: React.ReactNode;
};

export function PageContainer({ bg = 'bg-base-300', className, children }: TPageContainerProps) {
    return <div className={cn('min-h-full p-4 md:p-6 xl:p-10', bg, className)}>{children}</div>;
}
