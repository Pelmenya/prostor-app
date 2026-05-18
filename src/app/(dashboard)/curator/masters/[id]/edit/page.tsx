import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorMasterEditPage } from '@/views/dashboard/curator-master-edit';

export const metadata: Metadata = {
    title: `Настройки мастера — ${APP_NAME}`,
};

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function MasterEditPage({ params }: TProps) {
    const { id } = await params;
    return <CuratorMasterEditPage id={id} />;
}
