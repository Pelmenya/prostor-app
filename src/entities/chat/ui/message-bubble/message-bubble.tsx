'use client';

import { format } from 'date-fns';
import { CheckIcon } from '@heroicons/react/16/solid';
import { EUserRole } from '@/shared/model';
import { getStorageUrl } from '../../lib/get-storage-url';
import { ImageAttachment } from '../image-attachment/image-attachment';
import { FileAttachment } from '../file-attachment/file-attachment';
import type { TMessage } from '../../model/t-message';
import type { TMessageAttachment } from '../../model/t-message-attachment';

const ROLE_LABEL: Record<EUserRole, string> = {
    [EUserRole.CLIENT]: 'Клиент',
    [EUserRole.SERVICE]: 'Мастер',
    [EUserRole.CURATOR]: 'Куратор',
    [EUserRole.ADMIN]: 'Администратор',
};

type TProps = {
    message: TMessage;
    isOwn: boolean;
    onImageClick?: (attachment: TMessageAttachment) => void;
};

export function MessageBubble({ message, isOwn, onImageClick }: TProps) {
    const readCount = message.readBy.filter(
        (id: string) => id !== String(message.sender.id),
    ).length;
    const isRead = readCount > 0;

    return (
        <div className={`chat ${isOwn ? 'chat-end' : 'chat-start'}`}>
            {!isOwn && (
                <div className="chat-image avatar">
                    <div className="size-10 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center">
                        {message.sender.photo_url ? (
                            <img
                                src={getStorageUrl(message.sender.photo_url)}
                                alt={message.sender.first_name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="text-lg font-semibold">
                                {message.sender.first_name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div
                className={
                    isOwn
                        ? 'chat-bubble bg-primary text-primary-content'
                        : 'chat-bubble bg-base-100 text-base-content'
                }
            >
                {!isOwn && (
                    <div className="flex justify-between items-center gap-1 text-xs mb-1 opacity-70">
                        <p className="font-semibold">
                            {message.sender.first_name} {message.sender.last_name ?? ''}
                        </p>
                        <span className="lowercase">
                            {(ROLE_LABEL as Record<string, string>)[message.sender.role] ??
                                message.sender.role}
                        </span>
                    </div>
                )}

                {message.content && (
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                )}

                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                        {message.attachments.map((attachment: TMessageAttachment, index: number) =>
                            attachment.mimeType.startsWith('image/') ? (
                                <ImageAttachment
                                    key={`${message.id}-att-${index}`}
                                    attachment={attachment}
                                    onClick={() => onImageClick?.(attachment)}
                                />
                            ) : (
                                <FileAttachment
                                    key={`${message.id}-att-${index}`}
                                    attachment={attachment}
                                />
                            ),
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end mt-1 opacity-80 gap-0.5">
                    <span className="text-xs">{format(new Date(message.createdAt), 'HH:mm')}</span>
                    {isOwn && (
                        <span className="flex">
                            {isRead ? (
                                <>
                                    <CheckIcon className="size-3.5" />
                                    <CheckIcon className="size-3.5 -ml-2.5" />
                                </>
                            ) : (
                                <CheckIcon className="size-3.5" />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
