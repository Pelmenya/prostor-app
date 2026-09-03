'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { OrderChatView } from '@/widgets/order-chat-view';
import { ChatWindow } from '@/widgets/chat-window';

type TProps = {
    orderId: number;
};

export function OrderChatPage({ orderId }: TProps) {
    return (
        <OrderChatView
            orderId={orderId}
            header={
                <header className="flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-content/10">
                    <Link href={`/orders/${orderId}`} className="btn btn-ghost btn-sm btn-square">
                        <ArrowLeftIcon className="size-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-semibold">Чат по заказу #{orderId}</h1>
                        <p className="text-xs text-base-content/60">Мастер и куратор</p>
                    </div>
                </header>
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
        />
    );
}
