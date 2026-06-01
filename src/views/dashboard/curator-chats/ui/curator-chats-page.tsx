'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useGetUserActiveChats } from '@/entities/chat';
import { EChatType } from '@/entities/chat';
import { DashboardBackHeader, PageContainer } from '@/shared/ui';
import { curatorOrderChatPath, CURATOR_PATH } from '@/shared/config';
import type { TChatWithUnread } from '@/entities/chat';

export function CuratorChatsPage() {
    const { data: chats, isLoading } = useGetUserActiveChats();

    // Server already sorts by lastMessageAt DESC — just push unread to top
    const sorted = [...(chats ?? [])].sort((a, b) => b.unreadCount - a.unreadCount);

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Сообщения" fallbackHref={CURATOR_PATH} />

            <div className="max-w-lg mx-auto py-4 flex flex-col gap-2">
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                )}

                {!isLoading && sorted.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <ChatBubbleLeftEllipsisIcon className="size-12 text-base-content/30" />
                        <p className="text-base-content/60 text-sm">Нет активных чатов</p>
                    </div>
                )}

                {sorted.map((chat) => (
                    <ChatListItem key={chat.id} chat={chat} />
                ))}
            </div>
        </PageContainer>
    );
}

function ChatListItem({ chat }: { chat: TChatWithUnread }) {
    const href =
        chat.type === EChatType.ORDER && chat.entityId ? curatorOrderChatPath(chat.entityId) : null;

    // Backend returns messages[] but not a computed lastMessage field — derive it here
    const lastMsg = chat.messages?.length
        ? [...chat.messages]
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .at(-1)
        : null;

    const lastText = lastMsg
        ? (lastMsg.content ?? (lastMsg.attachments.length > 0 ? '📎 Вложение' : null))
        : null;

    const lastTime = lastMsg
        ? formatDistanceToNow(new Date(lastMsg.createdAt), { locale: ru, addSuffix: false })
        : null;

    const title =
        chat.type === EChatType.ORDER && chat.entityId ? `Заказ #${chat.entityId}` : 'Чат';

    const orderLabel = chat.type === EChatType.ORDER && chat.entityId ? `#${chat.entityId}` : '—';

    const content = (
        <div className="card bg-base-100 p-4 flex flex-row items-center gap-3">
            <div className="shrink-0 size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="text-xs font-bold leading-none">{orderLabel}</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{title}</span>
                    {lastTime && (
                        <span className="text-xs text-base-content/40 shrink-0">{lastTime}</span>
                    )}
                </div>
                <p className="text-xs text-base-content/60 truncate mt-0.5">
                    {lastText ?? 'Нет сообщений'}
                </p>
            </div>

            {chat.unreadCount > 0 && (
                <div className="badge badge-primary badge-sm shrink-0">{chat.unreadCount}</div>
            )}
        </div>
    );

    if (!href) return <div>{content}</div>;

    return <Link href={href}>{content}</Link>;
}
