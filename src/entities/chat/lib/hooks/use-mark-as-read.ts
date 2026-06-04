'use client';

import { useEffect, useRef } from 'react';
import { useMarkMessagesAsRead } from '../../api/chat.api';
import type { TMessage } from '../../model/t-chat';

type TParams = {
    chatId: string | null;
    messages: TMessage[];
    currentUserId: number;
    enabled?: boolean;
};

export function useMarkAsRead({ chatId, messages, currentUserId, enabled = true }: TParams) {
    const { mutate: markAsRead } = useMarkMessagesAsRead();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled || !chatId || messages.length === 0) return;

        const unreadMessages = messages.filter(
            (msg) => msg.sender.id !== currentUserId && !msg.readBy.includes(String(currentUserId)),
        );

        if (unreadMessages.length === 0) return;

        timeoutRef.current = setTimeout(() => {
            markAsRead({
                chatId,
                messageIds: unreadMessages.map((msg) => msg.id),
            });
        }, 1000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [chatId, messages, currentUserId, enabled, markAsRead]);
}
