import type { TChatParticipant } from './t-chat-participant';
import type { TMessageAttachment } from './t-message-attachment';
import type { EMessageType } from './e-message-type';

export type TMessage = {
    id: string;
    chatId: string;
    senderId: number;
    sender: TChatParticipant;
    type: EMessageType;
    content: string | null;
    attachments: TMessageAttachment[];
    metadata: Record<string, unknown> | null;
    readBy: string[];
    createdAt: string;
    updatedAt: string;
};
