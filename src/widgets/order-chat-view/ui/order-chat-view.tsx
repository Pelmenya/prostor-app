'use client';

import { useGetChatByOrderId } from '@/entities/chat';
import { QueryBoundary } from '@/shared/ui';

type TProps = {
    orderId: number;
    header: React.ReactNode;
    renderChat: (chatId: string) => React.ReactNode;
    emptyStateText?: string;
};

export function OrderChatView({
    orderId,
    header,
    renderChat,
    emptyStateText = 'Чат появится после назначения мастера на заказ',
}: TProps) {
    return (
        <div className="flex flex-col flex-1 min-h-0" data-chat-page="">
            <div className="shrink-0">{header}</div>
            <div className="flex-1 overflow-hidden">
                <QueryBoundary errorMessage="Ошибка загрузки чата" resetKeys={[orderId]}>
                    <OrderChatContent
                        orderId={orderId}
                        renderChat={renderChat}
                        emptyStateText={emptyStateText}
                    />
                </QueryBoundary>
            </div>
        </div>
    );
}

function OrderChatContent({
    orderId,
    renderChat,
    emptyStateText,
}: {
    orderId: number;
    renderChat: (chatId: string) => React.ReactNode;
    emptyStateText: string;
}) {
    const { data: chat, isLoading } = useGetChatByOrderId(orderId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                <p className="text-base-content/60 text-sm">Чат ещё не создан</p>
                <p className="text-base-content/40 text-xs">{emptyStateText}</p>
            </div>
        );
    }

    return renderChat(chat.id);
}
