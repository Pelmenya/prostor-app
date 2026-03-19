'use client';

import { PlatformProvider } from '@/shared/lib/platform';
import { QueryProvider } from '@/shared/api';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
    return (
        <PlatformProvider>
            <QueryProvider>{children}</QueryProvider>
        </PlatformProvider>
    );
}
