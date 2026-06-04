'use client';

import { Suspense } from 'react';
import { OrderChatView } from '@/widgets/order-chat-view';
import { ChatWindow } from '@/widgets/chat-window';
import { DashboardBackHeader } from '@/shared/ui';
import { masterOrderPath } from '@/shared/config';

type TProps = {
    orderId: number;
};

export function MasterOrderChatPage({ orderId }: TProps) {
    return (
        <OrderChatView
            orderId={orderId}
            header={
                <div className="px-4 py-3 bg-base-100 border-b border-base-content/10">
                    <DashboardBackHeader
                        title={`Чат по заказу #${orderId}`}
                        fallbackHref={masterOrderPath(orderId)}
                    />
                </div>
            }
            renderChat={(chatId) => (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    }
                >
                    <ChatWindow chatId={chatId} />
                </Suspense>
            )}
            emptyStateText="Чат появится после подтверждения заказа"
        />
    );
}
