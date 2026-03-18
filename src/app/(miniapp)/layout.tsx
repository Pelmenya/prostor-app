'use client';

import { MessengerProvider } from '@/shared/lib/messenger';
import { QueryProvider } from '@/shared/api';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
    return (
        <MessengerProvider>
            <QueryProvider>{children}</QueryProvider>
        </MessengerProvider>
    );
}
