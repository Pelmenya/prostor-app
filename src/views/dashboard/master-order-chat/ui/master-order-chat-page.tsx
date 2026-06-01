'use client';

import { Suspense } from 'react';
import { useGetChatByOrderId } from '@/entities/chat';
import { ChatWindow } from '@/widgets/chat-window';
import { DashboardBackHeader, QueryBoundary } from '@/shared/ui';
import { masterOrderPath } from '@/shared/config';

type TProps = {
    orderId: number;
};

export function MasterOrderChatPage({ orderId }: TProps) {
    return (
        <div className="flex flex-col h-dvh">
            <div className="px-4 py-3 bg-base-100 border-b border-base-content/10 shrink-0">
                <DashboardBackHeader
                    title={`Чат по заказу #${orderId}`}
                    fallbackHref={masterOrderPath(orderId)}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <QueryBoundary errorMessage="Ошибка загрузки чата" resetKeys={[orderId]}>
                    <MasterOrderChatContent orderId={orderId} />
                </QueryBoundary>
            </div>
        </div>
    );
}

function MasterOrderChatContent({ orderId }: TProps) {
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
                <p className="text-base-content/40 text-xs">
                    Чат появится после подтверждения заказа
                </p>
            </div>
        );
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-full">
                    <span className="loading loading-spinner loading-lg" />
                </div>
            }
        >
            <ChatWindow chatId={chat.id} />
        </Suspense>
    );
}
