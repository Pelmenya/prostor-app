'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useGetChatByOrderId } from '@/entities/chat';
import { ChatWindow } from '@/widgets/chat-window';
import { QueryBoundary } from '@/shared/ui';

type TProps = {
    orderId: number;
};

export function OrderChatPage({ orderId }: TProps) {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки чата" resetKeys={[orderId]}>
            <OrderChatContent orderId={orderId} />
        </QueryBoundary>
    );
}

function OrderChatContent({ orderId }: TProps) {
    const { data: chat, isLoading } = useGetChatByOrderId(orderId);

    return (
        <div className="flex flex-col flex-1 min-h-0" data-chat-page="">
            <header className="flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-content/10 shrink-0">
                <Link href={`/orders/${orderId}`} className="btn btn-ghost btn-sm btn-square">
                    <ArrowLeftIcon className="size-5" />
                </Link>
                <div>
                    <h1 className="text-sm font-semibold">Чат по заказу #{orderId}</h1>
                    <p className="text-xs text-base-content/60">Мастер и куратор</p>
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                ) : !chat ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                        <p className="text-base-content/60 text-sm">Чат ещё не создан</p>
                        <p className="text-base-content/40 text-xs">
                            Чат появится после назначения мастера на заказ
                        </p>
                    </div>
                ) : (
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center h-full">
                                <span className="loading loading-spinner loading-lg" />
                            </div>
                        }
                    >
                        <ChatWindow chatId={chat.id} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
