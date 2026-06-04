'use client';

import { useRef, useEffect, useState } from 'react';
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
    // Completed attachments keyed by upload id
    const [pendingMap, setPendingMap] = useState<Map<string, TMessageAttachment>>(new Map());
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useMarkAsRead({ chatId, messages, currentUserId: user.id });

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);
    const isAtBottomRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);
    // Keep a ref to uploadingFiles for cleanup on unmount (avoids stale closure)
    const uploadingFilesRef = useRef<TUploadFile[]>([]);
    useEffect(() => {
        uploadingFilesRef.current = uploadingFiles;
    }, [uploadingFiles]);

    // Revoke all ObjectURLs on unmount
    useEffect(() => {
        return () => {
            uploadingFilesRef.current.forEach((f) => {
                if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
            });
        };
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && isAtBottomRef.current) {
            virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'smooth' });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length]);

    // Invert wheel for the flipped list
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const handleWheel = (e: WheelEvent) => {
            scroller.scrollTop += -e.deltaY;
        };
        scroller.addEventListener('wheel', handleWheel, { passive: true });
        return () => scroller.removeEventListener('wheel', handleWheel);
    }, [isInitialLoadComplete, messages.length]);

    const reversedMessages = [...messages].reverse();

    const handleEndReached = () => {
        if (hasMore && !isLoadingMore) loadMore();
    };

    const handleFilesSelected = async (files: File[]) => {
        const newUploads: TUploadFile[] = files.map((file) => ({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));
        setUploadingFiles((prev) => [...prev, ...newUploads]);

        await Promise.allSettled(
            newUploads.map(async (upload) => {
                try {
                    setUploadingFiles((prev) =>
                        prev.map((f) => (f.id === upload.id ? { ...f, progress: 50 } : f)),
                    );
                    const attachment = await uploadFile({ chatId, file: upload.file });
                    setUploadingFiles((prev) =>
                        prev.map((f) => (f.id === upload.id ? { ...f, progress: 100 } : f)),
                    );
                    setPendingMap((prev) => new Map(prev).set(upload.id, attachment));
                } catch {
                    setUploadingFiles((prev) => prev.filter((f) => f.id !== upload.id));
                }
            }),
        );
    };

    const handleRemoveFile = (id: string) => {
        const file = uploadingFiles.find((f) => f.id === id);
        if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
        setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
        setPendingMap((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    const handleSendMessage = async (content: string) => {
        const pendingAttachments = uploadingFiles
            .filter((f) => pendingMap.has(f.id))
            .map((f) => pendingMap.get(f.id)!);

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
            setPendingMap(new Map());
        } catch {
            // keep UI intact on error
        }
    };

    const renderItem = (index: number, message: TMessage) => {
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
    };

    const Footer = () => {
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
    };

    const hasAttachments = uploadingFiles.some((f) => pendingMap.has(f.id));

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-base-300 overflow-hidden">
                {!isInitialLoadComplete ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-base-content/50">
                        <p className="text-sm">Нет сообщений. Начните общение.</p>
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

            {uploadError && (
                <div className="px-4 py-1 text-xs text-error bg-error/10 border-t border-error/20">
                    {uploadError}
                </div>
            )}

            <MessageInput
                onSendMessage={handleSendMessage}
                onFilesSelected={handleFilesSelected}
                isSending={isSending}
                uploadingFiles={uploadingFiles}
                onRemoveFile={handleRemoveFile}
                onValidationError={(errors) => setUploadError(errors[0] ?? null)}
                hasAttachments={hasAttachments}
            />

            {lightboxUrl && (
                <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
            )}
        </div>
    );
}
