import type { Metadata } from 'next';
import { MasterAccountPage } from '@/views/dashboard/master-account';

export const metadata: Metadata = {
    title: 'Мой профиль — PROSTOR',
};

export default function MasterPage() {
    return <MasterAccountPage />;
}
