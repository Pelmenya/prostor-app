import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterSettingsPage } from '@/views/dashboard/master-settings';

export const metadata: Metadata = {
    title: `Настройка профиля — ${APP_NAME}`,
};

export default function SettingsPage() {
    return <MasterSettingsPage />;
}
