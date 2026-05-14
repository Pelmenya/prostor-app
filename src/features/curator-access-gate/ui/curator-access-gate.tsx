'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/entities/user';
import { EUserRole } from '@/shared/model';

type TCuratorAccessGateProps = {
    children: React.ReactNode;
};

export function CuratorAccessGate({ children }: TCuratorAccessGateProps) {
    const router = useRouter();
    const { data: user, isLoading } = useCurrentUser();

    const isCurator = user?.role === EUserRole.CURATOR;

    useEffect(() => {
        if (isLoading) return;
        if (!user || !isCurator) {
            router.replace('/');
        }
    }, [user, isCurator, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-dvh">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!user || !isCurator) return null;

    return <>{children}</>;
}
