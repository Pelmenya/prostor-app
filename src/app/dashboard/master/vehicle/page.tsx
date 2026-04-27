import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { MasterVehiclePage } from '@/views/dashboard/master-vehicle';

export const metadata: Metadata = {
    title: `Автомобиль — ${APP_NAME}`,
};

export default function VehiclePage() {
    return <MasterVehiclePage />;
}
