import type { Metadata } from 'next';
import { MasterServiceAreaPage } from '@/views/dashboard/master-service-area';

export const metadata: Metadata = {
    title: 'Зоны обслуживания — PROSTOR',
};

export default function ServiceAreaPage() {
    return <MasterServiceAreaPage />;
}
