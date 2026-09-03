import type { Metadata } from 'next';
import { MasterPublicPage } from '@/views/web/master-public';
import { APP_NAME } from '@/shared/config';

type TRouteProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TRouteProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Мастер #${id} — ${APP_NAME}`,
    };
}

export default async function MasterPublicRoute({ params }: TRouteProps) {
    const { id } = await params;
    return <MasterPublicPage masterId={Number(id)} />;
}
