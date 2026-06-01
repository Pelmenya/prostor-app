'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '@/shared/config';
import { useAuth } from '@/shared/lib/platform';
import type { TMessage, TGetMessagesResponse } from '../../model/t-chat';

type TUseChatMessagesParams = {
    chatId: string | null;
    pollingInterval?: number;
    enabled?: boolean;
    limit?: number;
};

type TUseChatMessagesResult = {
    messages: TMessage[];
    isLoading: boolean;
    isLoadingMore: boolean;
    isInitialLoadComplete: boolean;
    hasMore: boolean;
    loadMore: () => void;
    addMessage: (message: TMessage) => void;
};

export function useChatMessages({
    chatId,
    pollingInterval = 5000,
    enabled = true,
    limit = 30,
}: TUseChatMessagesParams): TUseChatMessagesResult {
    const { authHeader } = useAuth();
    const shouldFetch = enabled && chatId !== null;

    const [messages, setMessages] = useState<TMessage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isLoadingMoreRef = useRef(false);

    const fetchMessages = useCallback(
        async (cursor?: string): Promise<TGetMessagesResponse | null> => {
            if (!chatId) return null;

            const url = new URL(`${API_URL}/chat/${chatId}/messages`);
            if (cursor) url.searchParams.set('cursor', cursor);
            url.searchParams.set('limit', String(limit));

            const response = await fetch(url.toString(), {
                headers: authHeader ? { Authorization: authHeader } : undefined,
                credentials: 'include',
            });

            if (!response.ok) {
                const err = new Error(
                    `Failed to fetch messages: ${response.status} ${response.statusText}`,
                );
                (err as Error & { status: number }).status = response.status;
                throw err;
            }
            return response.json() as Promise<TGetMessagesResponse>;
        },
        [chatId, limit, authHeader],
    );

    // Первоначальная загрузка
    useEffect(() => {
        if (!shouldFetch) return;

        const loadInitial = async () => {
            setIsLoading(true);
            try {
                const data = await fetchMessages();
                if (data) {
                    setMessages(data.messages);
                    setNextCursor(data.nextCursor);
                    setHasMore(data.hasMore);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setIsLoading(false);
                setIsInitialLoadComplete(true);
            }
        };

        void loadInitial();
    }, [shouldFetch, fetchMessages]);

    // Polling для новых сообщений
    useEffect(() => {
        if (!shouldFetch || !isInitialLoadComplete) return;

        const poll = async () => {
            try {
                const data = await fetchMessages();
                if (!data || data.messages.length === 0) return;

                setMessages((prev) => {
                    const existingIds = new Set(prev.map((m) => m.id));
                    const trulyNew = data.messages.filter((m) => !existingIds.has(m.id));

                    const newMessagesMap = new Map(data.messages.map((m) => [m.id, m]));
                    let hasReadByChanges = false;
                    for (const msg of prev) {
                        const newVersion = newMessagesMap.get(msg.id);
                        if (
                            newVersion &&
                            JSON.stringify(msg.readBy) !== JSON.stringify(newVersion.readBy)
                        ) {
                            hasReadByChanges = true;
                            break;
                        }
                    }

                    if (trulyNew.length === 0 && !hasReadByChanges) return prev;

                    const updatedMessages = hasReadByChanges
                        ? prev.map((msg) => {
                              const newVersion = newMessagesMap.get(msg.id);
                              if (
                                  newVersion &&
                                  JSON.stringify(msg.readBy) !== JSON.stringify(newVersion.readBy)
                              ) {
                                  return { ...msg, readBy: newVersion.readBy };
                              }
                              return msg;
                          })
                        : prev;

                    if (trulyNew.length > 0) {
                        const sorted = trulyNew.sort(
                            (a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                        );
                        return [...updatedMessages, ...sorted];
                    }

                    return updatedMessages;
                });
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        pollingIntervalRef.current = setInterval(poll, pollingInterval);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [shouldFetch, isInitialLoadComplete, fetchMessages, pollingInterval]);

    // Сброс при смене чата
    useEffect(() => {
        setMessages([]);
        setNextCursor(null);
        setHasMore(true);
        setIsInitialLoadComplete(false);
        isLoadingMoreRef.current = false;
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    }, [chatId]);

    const loadMore = useCallback(async () => {
        if (!shouldFetch || !nextCursor || isLoadingMoreRef.current || !hasMore) return;

        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        try {
            const data = await fetchMessages(nextCursor);
            if (data && data.messages.length > 0) {
                setMessages((prev) => [...data.messages, ...prev]);
                setNextCursor(data.nextCursor);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    }, [shouldFetch, nextCursor, hasMore, fetchMessages]);

    const addMessage = useCallback((message: TMessage) => {
        setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
        });
    }, []);

    return {
        messages,
        isLoading,
        isLoadingMore,
        isInitialLoadComplete,
        hasMore,
        loadMore,
        addMessage,
    };
}
