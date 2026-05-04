import type { Metadata } from 'next';
import { MasterRatingPage } from '@/views/web/master-rating';
import { APP_NAME } from '@/shared/config';

type TRouteProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TRouteProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Рейтинг мастера #${id} — ${APP_NAME}`,
    };
}

export default async function MasterRatingRoute({ params }: TRouteProps) {
    const { id } = await params;
    return <MasterRatingPage masterId={Number(id)} />;
}
