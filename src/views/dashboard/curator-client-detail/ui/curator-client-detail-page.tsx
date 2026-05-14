'use client';

import { PageContainer, DashboardBackHeader } from '@/shared/ui';
import { CURATOR_CLIENTS_PATH } from '@/shared/config';

type TCuratorClientDetailPageProps = {
    id: string;
};

export function CuratorClientDetailPage({ id }: TCuratorClientDetailPageProps) {
    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Клиент #${id}`} fallbackHref={CURATOR_CLIENTS_PATH} />
        </PageContainer>
    );
}
