import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterQualificationPage } from '@/views/dashboard/master-qualification';

export const metadata: Metadata = {
    title: `Квалификация — ${APP_NAME}`,
};

export default function QualificationPage() {
    return <MasterQualificationPage />;
}
