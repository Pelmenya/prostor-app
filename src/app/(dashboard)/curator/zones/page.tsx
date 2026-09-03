import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorZonesPage } from '@/views/dashboard/curator-zones';

export const metadata: Metadata = {
    title: `Зоны обслуживания — ${APP_NAME}`,
};

export default function ZonesPage() {
    return <CuratorZonesPage />;
}
