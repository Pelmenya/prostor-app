'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { WeeklyScheduleForm, WorkScheduleCalendar } from '@/features/master-schedule';
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
            <div className="flex flex-col gap-8 max-w-lg mx-auto py-4">
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">Рабочие дни</p>
                    <p className="text-sm text-base-content/60">
                        Нажмите на дату чтобы добавить или изменить рабочий день.
                    </p>
                    <WorkScheduleCalendar />
                </div>

                <div className="divider my-0" />

                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">Еженедельное расписание</p>
                    <p className="text-sm text-base-content/60">
                        Шаблон для автоматического заполнения календаря на выбранное количество
                        месяцев вперёд.
                    </p>
                    <WeeklyScheduleForm />
                </div>
            </div>
        </PageContainer>
    );
}
