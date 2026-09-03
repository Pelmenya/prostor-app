'use client';

import { PlatformProvider } from '@/shared/lib/platform';

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
    return <PlatformProvider>{children}</PlatformProvider>;
}
