import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterPersonalInfoPage } from '@/views/dashboard/master-personal-info';

export const metadata: Metadata = {
    title: `Личная информация — ${APP_NAME}`,
};

export default function ProfilePage() {
    return <MasterPersonalInfoPage />;
}
