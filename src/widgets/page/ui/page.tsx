'use client';

import { cn } from '@/shared/lib/cn';

type TPageProps = {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
};

export function Page({ children, header, footer, className }: TPageProps) {
    return (
        <div className="flex flex-col bg-base-100 w-screen h-screen border border-base-content/10">
            {header}

            <div className="relative flex-1 flex flex-col min-h-0">
                <main className={cn('flex-1 overflow-y-auto p-4 md:p-6 xl:p-10', className)}>
                    {children}
                </main>
            </div>

            {footer}
        </div>
    );
}
