'use client';

import { PageContainer, DashboardBackHeader } from '@/shared/ui';
import { CURATOR_ORDERS_PATH } from '@/shared/config';

type TCuratorOrderDetailPageProps = {
    id: string;
};

export function CuratorOrderDetailPage({ id }: TCuratorOrderDetailPageProps) {
    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title={`Заказ #${id}`} fallbackHref={CURATOR_ORDERS_PATH} />
        </PageContainer>
    );
}
