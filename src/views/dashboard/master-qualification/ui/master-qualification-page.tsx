'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAccountService } from '@/entities/account-service';
import { QualificationForm } from '@/features/master-qualification';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function MasterQualificationPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки квалификации">
            <MasterQualificationContent />
        </QueryBoundary>
    );
}

function MasterQualificationContent() {
    const router = useRouter();
    const { data: accountService } = useAccountService();

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
                <PageTitle>Квалификация</PageTitle>
            </div>
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <QualificationForm initialGrade={accountService?.grade} />
            </div>
        </PageContainer>
    );
}
