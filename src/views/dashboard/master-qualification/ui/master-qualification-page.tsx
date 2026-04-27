'use client';

import { useAccountService } from '@/entities/account-service';
import { QualificationForm } from '@/features/master-qualification';
import { PageContainer, PageSpinner, QueryBoundary, DashboardBackHeader } from '@/shared/ui';
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
    const { data: accountService } = useAccountService();

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Квалификация" />
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                <QualificationForm initialGrade={accountService?.grade} />
            </div>
        </PageContainer>
    );
}
