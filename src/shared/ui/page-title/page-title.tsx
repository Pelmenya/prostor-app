import { cn } from '@/shared/lib/cn';

type TPageTitleProps = {
    children: React.ReactNode;
    className?: string;
};

export function PageTitle({ children, className }: TPageTitleProps) {
    return <h1 className={cn('text-lg font-semibold lg:text-xl', className)}>{children}</h1>;
}
