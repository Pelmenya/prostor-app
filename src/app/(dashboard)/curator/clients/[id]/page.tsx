import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorClientDetailPage } from '@/views/dashboard/curator-client-detail';

export const metadata: Metadata = {
    title: `Клиент — ${APP_NAME}`,
};

type TProps = {
    params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: TProps) {
    const { id } = await params;
    return <CuratorClientDetailPage id={id} />;
}
