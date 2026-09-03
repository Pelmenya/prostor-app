import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterWorkDaysPage } from '@/views/dashboard/master-work-days';

export const metadata: Metadata = {
    title: `Работа — ${APP_NAME}`,
};

export default function WorkDaysPage() {
    return <MasterWorkDaysPage />;
}
