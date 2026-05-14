import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorMastersPage } from '@/views/dashboard/curator-masters';

export const metadata: Metadata = {
    title: `Мастера — ${APP_NAME}`,
};

export default function MastersPage() {
    return <CuratorMastersPage />;
}
