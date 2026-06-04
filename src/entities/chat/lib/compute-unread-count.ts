import type { TMessage } from '../model/t-message';

export function computeUnreadCount(messages: TMessage[], currentUserId: number): number {
    const userIdStr = String(currentUserId);
    return messages.filter((m) => m.senderId !== currentUserId && !m.readBy.includes(userIdStr))
        .length;
}
