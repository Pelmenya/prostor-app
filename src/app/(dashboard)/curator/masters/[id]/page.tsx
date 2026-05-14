import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorMasterDetailPage } from '@/views/dashboard/curator-master-detail';

export const metadata: Metadata = {
    title: `Мастер — ${APP_NAME}`,
};

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function MasterDetailPage({ params }: TProps) {
    const { id } = await params;
    return <CuratorMasterDetailPage id={id} />;
}
