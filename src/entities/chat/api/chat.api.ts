import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { API_URL } from '@/shared/config';
import { useAuth } from '@/shared/lib/platform';
import type { TChat, TChatWithUnread, TMessage } from '../model/t-chat';
import type { TMessageAttachment } from '../model/t-message-attachment';
import type { EMessageType } from '../model/e-message-type';

export const chatKeys = {
    all: ['chats'] as const,
    list: () => ['chats', 'list'] as const,
    detail: (chatId: string) => ['chats', 'detail', chatId] as const,
    byOrder: (orderId: number) => ['chats', 'order', orderId] as const,
};

export function useGetChatByOrderId(orderId: number) {
    const api = useApi();
    return useQuery({
        queryKey: chatKeys.byOrder(orderId),
        queryFn: () => api<TChat>(`/chat/order/${orderId}`),
        staleTime: 30_000,
    });
}

export function useGetUserActiveChats() {
    const api = useApi();
    return useQuery({
        queryKey: chatKeys.list(),
        queryFn: () => api<TChatWithUnread[]>('/chat/my'),
        staleTime: 30_000,
        refetchInterval: 30_000,
    });
}

export function useGetUnreadCount() {
    const api = useApi();
    return useQuery({
        queryKey: chatKeys.list(),
        queryFn: () => api<TChatWithUnread[]>('/chat/my'),
        staleTime: 30_000,
        refetchInterval: 30_000,
        select: (chats) => ({
            count: chats.reduce((sum, chat) => sum + (chat.unreadCount ?? 0), 0),
        }),
    });
}

type TCreateMessageBody = {
    chatId: string;
    type: EMessageType;
    content?: string;
    attachments?: TMessageAttachment[];
    metadata?: Record<string, unknown>;
};

export function useCreateMessage() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chatId, ...rest }: TCreateMessageBody) =>
            api<TMessage>(`/chat/${chatId}/messages`, {
                method: 'POST',
                body: { chatId, ...rest },
            }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: chatKeys.detail(variables.chatId) });
            void queryClient.invalidateQueries({ queryKey: chatKeys.list() });
        },
    });
}

export function useMarkMessagesAsRead() {
    const api = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) =>
            api<void>(`/chat/${chatId}/messages/mark-read`, {
                method: 'POST',
                body: { messageIds },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: chatKeys.list() });
        },
    });
}

export function useUploadChatFile() {
    const { authHeader } = useAuth();

    return useMutation({
        mutationFn: async ({
            chatId,
            file,
        }: {
            chatId: string;
            file: File;
        }): Promise<TMessageAttachment> => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/chat/${chatId}/upload`, {
                method: 'POST',
                headers: authHeader ? { Authorization: authHeader } : undefined,
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Upload failed');
            return response.json() as Promise<TMessageAttachment>;
        },
    });
}
