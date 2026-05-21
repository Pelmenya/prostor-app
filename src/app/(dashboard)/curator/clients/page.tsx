import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorClientsPage } from '@/views/dashboard/curator-clients';

export const metadata: Metadata = {
    title: `Клиенты — ${APP_NAME}`,
};

export default function ClientsPage() {
    return <CuratorClientsPage />;
}
