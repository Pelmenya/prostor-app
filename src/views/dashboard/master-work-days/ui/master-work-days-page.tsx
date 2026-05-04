'use client';

import { useRouter } from 'next/navigation';
import { WorkDaysCalendar } from '@/features/master-work-days';
import { PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

export function MasterWorkDaysPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки рабочих дней">
            <MasterWorkDaysContent />
        </QueryBoundary>
    );
}

function MasterWorkDaysContent() {
    const router = useRouter();

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Работа" />
            <div className="flex flex-col gap-4 max-w-lg mx-auto py-4">
                <p className="text-sm text-base-content/60">
                    Выберите рабочий день чтобы посмотреть маршрут и заказы.
                </p>
                <WorkDaysCalendar onDayClick={(date) => router.push(`/master/work-days/${date}`)} />
            </div>
        </PageContainer>
    );
}
