import type { Metadata } from 'next';
import { MasterLocationPage } from '@/views/dashboard/master-location';

export const metadata: Metadata = {
    title: 'Локация — PROSTOR',
};

export default function LocationPage() {
    return <MasterLocationPage />;
}
