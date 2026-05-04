'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/entities/user';
import { EUserRole } from '@/shared/model';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: user, isLoading } = useCurrentUser();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace('/');
            return;
        }
        if (user.role !== EUserRole.SERVICE) {
            router.replace('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-dvh">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!user || user.role !== EUserRole.SERVICE) return null;

    return <>{children}</>;
}
