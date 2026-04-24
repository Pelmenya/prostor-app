'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { WeeklyScheduleForm } from '@/features/master-schedule';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function MasterSchedulePage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки расписания">
            <MasterScheduleContent />
        </QueryBoundary>
    );
}

function MasterScheduleContent() {
    const router = useRouter();

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
                <PageTitle>График работы</PageTitle>
            </div>
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <p className="text-sm text-base-content/60">
                    Укажите дни и часы работы. Календарь будет заполнен автоматически на указанное
                    количество месяцев вперёд.
                </p>
                <WeeklyScheduleForm />
            </div>
        </PageContainer>
    );
}
