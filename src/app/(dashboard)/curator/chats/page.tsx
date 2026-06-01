import type { Metadata } from 'next';
import { CuratorChatsPage } from '@/views/dashboard/curator-chats';

export const metadata: Metadata = { title: 'Сообщения — PROSTOR' };

export default function CuratorChatsRoute() {
    return <CuratorChatsPage />;
}
