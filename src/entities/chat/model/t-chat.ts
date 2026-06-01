import type { TChatParticipant } from './t-chat-participant';
import type { TMessage } from './t-message';
import type { EChatType } from './e-chat-type';
import type { EChatStatus } from './e-chat-status';

export type { TMessage } from './t-message';

export type TChat = {
    id: string;
    type: EChatType;
    entityId: string | null;
    participants: TChatParticipant[];
    status: EChatStatus;
    lastMessage: TMessage | null;
    messages?: TMessage[];
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
};

export type TChatWithUnread = TChat & {
    unreadCount: number;
};

export type TGetMessagesResponse = {
    messages: TMessage[];
    nextCursor: string | null;
    hasMore: boolean;
};
