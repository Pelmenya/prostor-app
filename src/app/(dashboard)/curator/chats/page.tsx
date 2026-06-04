import type { Metadata } from 'next';
import { APP_NAME } from '@/shared/config';
import { CuratorChatsPage } from '@/views/dashboard/curator-chats';

export const metadata: Metadata = { title: `Сообщения — ${APP_NAME}` };

export default function CuratorChatsRoute() {
    return <CuratorChatsPage />;
}
