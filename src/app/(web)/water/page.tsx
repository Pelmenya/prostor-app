import type { Metadata } from 'next';
import { WaterMapPage } from '@/views/water-map';

export const metadata: Metadata = {
    title: 'Карта качества воды — PROSTOR',
    description:
        'Тепловая карта качества воды по 15 504 анализам Аквафор-Pro в Москве и Подмосковье. Найди свой район, увидь проблемы воды у соседей, подбери оборудование.',
};

export default function WaterPage() {
    return <WaterMapPage />;
}
