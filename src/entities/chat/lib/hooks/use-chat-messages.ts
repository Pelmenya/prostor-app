'use client';

import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { buildSearchParams } from '@/shared/lib';
import { chatKeys } from '../../api/chat.api';
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
    const api = useApi();
    const queryClient = useQueryClient();

    const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: chatKeys.messages(chatId ?? ''),
        queryFn: ({ pageParam }) => {
            const qs = buildSearchParams({ cursor: pageParam, limit });
            return api<TGetMessagesResponse>(`/chat/${chatId}/messages?${qs}`);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
        refetchInterval: pollingInterval,
        staleTime: 0,
        enabled: enabled && !!chatId,
    });

    // pages[0] = newest batch (oldest→newest within batch)
    // pages[1] = older batch, etc.
    // Reverse pages order to get all messages oldest→newest
    const messages: TMessage[] = data ? [...data.pages].reverse().flatMap((p) => p.messages) : [];

    const addMessage = (message: TMessage) => {
        if (!chatId) return;
        queryClient.setQueryData<InfiniteData<TGetMessagesResponse>>(
            chatKeys.messages(chatId),
            (old) => {
                if (!old) return old;
                const [firstPage, ...rest] = old.pages;
                if (firstPage.messages.some((m) => m.id === message.id)) return old;
                return {
                    ...old,
                    pages: [{ ...firstPage, messages: [...firstPage.messages, message] }, ...rest],
                };
            },
        );
    };

    return {
        messages,
        isLoading: isPending,
        isLoadingMore: isFetchingNextPage,
        isInitialLoadComplete: !isPending,
        hasMore: hasNextPage ?? false,
        loadMore: () => {
            void fetchNextPage();
        },
        addMessage,
    };
}
