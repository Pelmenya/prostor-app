'use client';

import { PageContainer, DashboardBackHeader } from '@/shared/ui';
import { CURATOR_MASTERS_PATH } from '@/shared/config';

type TCuratorMasterDetailPageProps = {
    id: string;
};

export function CuratorMasterDetailPage({ id }: TCuratorMasterDetailPageProps) {
    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Мастер #${id}`} fallbackHref={CURATOR_MASTERS_PATH} />
        </PageContainer>
    );
}
