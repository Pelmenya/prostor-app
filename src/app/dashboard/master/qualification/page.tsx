import type { Metadata } from 'next';
import { MasterQualificationPage } from '@/views/dashboard/master-qualification';

export const metadata: Metadata = {
    title: 'Квалификация — PROSTOR',
};

export default function QualificationPage() {
    return <MasterQualificationPage />;
}
