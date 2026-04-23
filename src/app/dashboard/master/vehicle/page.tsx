import type { Metadata } from 'next';
import { MasterVehiclePage } from '@/views/dashboard/master-vehicle';

export const metadata: Metadata = {
    title: 'Автомобиль — PROSTOR',
};

export default function VehiclePage() {
    return <MasterVehiclePage />;
}
