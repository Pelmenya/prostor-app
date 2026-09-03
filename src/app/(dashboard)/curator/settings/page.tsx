import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorSettingsPage } from '@/views/dashboard/curator-settings';

export const metadata: Metadata = {
    title: `Настройки — ${APP_NAME}`,
};

export default function SettingsPage() {
    return <CuratorSettingsPage />;
}
