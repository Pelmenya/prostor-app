import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterServiceAreaPage } from '@/views/dashboard/master-service-area';

export const metadata: Metadata = {
    title: `Зоны обслуживания — ${APP_NAME}`,
};

export default function ServiceAreaPage() {
    return <MasterServiceAreaPage />;
}
