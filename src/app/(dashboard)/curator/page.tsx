import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorAccountPage } from '@/views/dashboard/curator-account';

export const metadata: Metadata = {
    title: `Куратор — ${APP_NAME}`,
};

export default function CuratorPage() {
    return <CuratorAccountPage />;
}
