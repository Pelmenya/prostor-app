import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterChangeEmailPage } from '@/views/dashboard/master-change-email';

export const metadata: Metadata = {
    title: `Изменить email — ${APP_NAME}`,
};

export default function ChangeEmailPage() {
    return <MasterChangeEmailPage />;
}
