'use client';

import { notFound } from 'next/navigation';
import { useCurrentUser } from '@/entities/user';
import { EUserRole } from '@/shared/model';

type TCuratorAccessGateProps = {
    children: React.ReactNode;
};

export function CuratorAccessGate({ children }: TCuratorAccessGateProps) {
    const { data: user, isLoading } = useCurrentUser();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-dvh">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!user || user.role !== EUserRole.CURATOR) {
        notFound();
    }

    return <>{children}</>;
}
