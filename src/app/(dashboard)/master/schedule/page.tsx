import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterSchedulePage } from '@/views/dashboard/master-schedule';

export const metadata: Metadata = {
    title: `График работы — ${APP_NAME}`,
};

export default function SchedulePage() {
    return <MasterSchedulePage />;
}
