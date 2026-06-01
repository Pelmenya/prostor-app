'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { startOfDay } from 'date-fns';
import { useCurrentUserSuspense } from '@/entities/user';
import {
    useChatMessages,
    useMarkAsRead,
    useCreateMessage,
    useUploadChatFile,
    EMessageType,
    formatMessageDate,
    getStorageUrl,
    MessageBubble,
    MessageInput,
    ImageLightbox,
} from '@/entities/chat';
import type { TMessage, TMessageAttachment, TUploadFile } from '@/entities/chat';

type TProps = {
    chatId: string;
};

export function ChatWindow({ chatId }: TProps) {
    const { data: user } = useCurrentUserSuspense();

    const { messages, isLoadingMore, isInitialLoadComplete, hasMore, loadMore, addMessage } =
        useChatMessages({ chatId, pollingInterval: 5000 });

    const { mutateAsync: createMessage, isPending: isSending } = useCreateMessage();
    const { mutateAsync: uploadFile } = useUploadChatFile();

    const [uploadingFiles, setUploadingFiles] = useState<TUploadFile[]>([]);
    const [pendingAttachments, setPendingAttachments] = useState<TMessageAttachment[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useMarkAsRead({ chatId, messages, currentUserId: user.id });

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);
    const isAtBottomRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);

    // Скролл вниз при новых сообщениях
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && isAtBottomRef.current) {
            virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'smooth' });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length]);

    // Инверсия колеса для перевёрнутого списка
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            scroller.scrollTop += -e.deltaY;
        };
        scroller.addEventListener('wheel', handleWheel, { passive: false });
        return () => scroller.removeEventListener('wheel', handleWheel);
    }, [isInitialLoadComplete, messages.length]);

    const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

    const handleEndReached = useCallback(() => {
        if (hasMore && !isLoadingMore) loadMore();
    }, [hasMore, isLoadingMore, loadMore]);

    const handleFilesSelected = useCallback(
        async (files: File[]) => {
            const newUploads: TUploadFile[] = files.map((file) => ({
                file,
                progress: 0,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            }));
            setUploadingFiles((prev) => [...prev, ...newUploads]);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const idx = uploadingFiles.length + i;
                try {
                    setUploadingFiles((prev) =>
                        prev.map((f, j) => (j === idx ? { ...f, progress: 50 } : f)),
                    );
                    const attachment = await uploadFile({ chatId, file });
                    setUploadingFiles((prev) =>
                        prev.map((f, j) => (j === idx ? { ...f, progress: 100 } : f)),
                    );
                    setPendingAttachments((prev) => [...prev, attachment]);
                } catch {
                    setUploadingFiles((prev) => prev.filter((_, j) => j !== idx));
                }
            }
        },
        [chatId, uploadFile, uploadingFiles.length],
    );

    const handleRemoveFile = useCallback((index: number) => {
        setUploadingFiles((prev) => {
            const f = prev[index];
            if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
            return prev.filter((_, i) => i !== index);
        });
        setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSendMessage = async (content: string) => {
        if (!content.trim() && pendingAttachments.length === 0) return;

        const hasImages = pendingAttachments.some((a) => a.mimeType.startsWith('image/'));
        const messageType =
            pendingAttachments.length > 0
                ? hasImages
                    ? EMessageType.IMAGE
                    : EMessageType.FILE
                : EMessageType.TEXT;

        try {
            const newMessage = await createMessage({
                chatId,
                type: messageType,
                ...(content.trim() && { content: content.trim() }),
                attachments: pendingAttachments,
                metadata: {},
            });
            addMessage(newMessage);
            uploadingFiles.forEach((f) => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
            });
            setUploadingFiles([]);
            setPendingAttachments([]);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const renderItem = useCallback(
        (index: number, message: TMessage) => {
            const nextMessage =
                index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
            const showDateSeparator =
                index === reversedMessages.length - 1 ||
                (nextMessage &&
                    startOfDay(new Date(message.createdAt)).getTime() !==
                        startOfDay(new Date(nextMessage.createdAt)).getTime());

            return (
                <div className="px-4" style={{ transform: 'scaleY(-1)' }}>
                    {showDateSeparator && (
                        <div className="flex justify-center my-2">
                            <div className="badge badge-sm badge-ghost shadow-sm">
                                {formatMessageDate(message.createdAt)}
                            </div>
                        </div>
                    )}
                    <MessageBubble
                        message={message}
                        isOwn={message.sender.id === user.id}
                        onImageClick={(att) => setLightboxUrl(getStorageUrl(att.path))}
                    />
                </div>
            );
        },
        [reversedMessages, user.id],
    );

    const Footer = useCallback(() => {
        if (!hasMore) return null;
        return (
            <div className="flex justify-center py-2" style={{ transform: 'scaleY(-1)' }}>
                {isLoadingMore ? (
                    <span className="loading loading-spinner loading-sm" />
                ) : (
                    <span className="text-xs text-base-content/50">Загрузка...</span>
                )}
            </div>
        );
    }, [hasMore, isLoadingMore]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-base-300 overflow-hidden">
                {!isInitialLoadComplete ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-base-content/50">
                        <p className="text-sm">Нет сообщений. Начните общение!</p>
                    </div>
                ) : (
                    <Virtuoso
                        ref={virtuosoRef}
                        scrollerRef={(ref) => {
                            scrollerRef.current = ref as HTMLElement;
                        }}
                        style={{ height: '100%', overflowX: 'hidden', transform: 'scaleY(-1)' }}
                        data={reversedMessages}
                        initialTopMostItemIndex={0}
                        endReached={handleEndReached}
                        itemContent={renderItem}
                        components={{ Footer }}
                        followOutput={false}
                        atTopStateChange={(atTop) => {
                            isAtBottomRef.current = atTop;
                        }}
                    />
                )}
            </div>

            <MessageInput
                onSendMessage={handleSendMessage}
                onFilesSelected={handleFilesSelected}
                disabled={isSending}
                uploadingFiles={uploadingFiles}
                onRemoveFile={handleRemoveFile}
                hasAttachments={pendingAttachments.length > 0}
            />

            {lightboxUrl && (
                <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
            )}
        </div>
    );
}
