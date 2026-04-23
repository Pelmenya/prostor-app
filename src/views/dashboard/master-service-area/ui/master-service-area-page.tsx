'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAccountService } from '@/entities/account-service';
import { ZoneSelector } from '@/features/master-service-area';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function MasterServiceAreaPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки зон обслуживания">
            <MasterServiceAreaContent />
        </QueryBoundary>
    );
}

function MasterServiceAreaContent() {
    const router = useRouter();
    const { data: accountService } = useAccountService();

    const center = accountService?.coordinates
        ? {
              latitude: accountService.coordinates.coordinates[1],
              longitude: accountService.coordinates.coordinates[0],
          }
        : undefined;

    return (
        <PageContainer bg="bg-base-200">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Назад"
                >
                    <ArrowLeftIcon className="size-5" />
                </button>
                <PageTitle>Зоны обслуживания</PageTitle>
            </div>
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <ZoneSelector center={center} onSuccess={() => router.back()} />
            </div>
        </PageContainer>
    );
}
