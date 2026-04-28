'use client';

import { useAccountService } from '@/entities/account-service';
import { VehicleForm } from '@/features/master-vehicle';
import { PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

export function MasterVehiclePage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки данных автомобиля">
            <MasterVehicleContent />
        </QueryBoundary>
    );
}

function MasterVehicleContent() {
    const { data: accountService } = useAccountService();

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Автомобиль" />
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <VehicleForm initialData={accountService} />
            </div>
        </PageContainer>
    );
}
