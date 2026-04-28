'use client';

import { useRouter } from 'next/navigation';
import { useAccountService } from '@/entities/account-service';
import { ZoneSelector } from '@/features/master-service-area';
import { PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

export function MasterServiceAreaPage() {
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
            <DashboardBackHeader title="Зоны обслуживания" />
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <ZoneSelector center={center} onSuccess={() => router.back()} />
            </div>
        </PageContainer>
    );
}
