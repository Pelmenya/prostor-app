'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/entities/user';
import { useAccountServiceQuery } from '@/entities/account-service';
import { EUserRole } from '@/shared/model';

const SETUP_PATH = '/dashboard/master/settings';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: user, isLoading: isUserLoading } = useCurrentUser();

    const isService = user?.role === EUserRole.SERVICE;
    const { data: accountService, isLoading: isServiceLoading } = useAccountServiceQuery({
        enabled: isService,
    });

    const isLoading = isUserLoading || (isService && isServiceLoading);

    useEffect(() => {
        if (isLoading) return;

        if (!user || !isService) {
            router.replace('/');
            return;
        }

        const setupCompleted = accountService?.serviceSetup?.completed ?? false;
        if (!setupCompleted && pathname !== SETUP_PATH) {
            router.replace(SETUP_PATH);
        }
    }, [user, isService, isLoading, accountService, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-dvh">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!user || !isService) return null;

    return <>{children}</>;
}
