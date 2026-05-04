import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterAccountPage } from '@/views/dashboard/master-account';

export const metadata: Metadata = {
    title: `Мой профиль — ${APP_NAME}`,
};

export default function MasterPage() {
    return <MasterAccountPage />;
}
