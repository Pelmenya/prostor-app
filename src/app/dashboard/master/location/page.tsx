import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterLocationPage } from '@/views/dashboard/master-location';

export const metadata: Metadata = {
    title: `Локация — ${APP_NAME}`,
};

export default function LocationPage() {
    return <MasterLocationPage />;
}
