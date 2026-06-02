import type { TMessage } from '../model/t-message';

export function computeUnreadCount(messages: TMessage[], currentUserId: number): number {
    const userIdStr = String(currentUserId);
    return messages.filter(
        // readBy[0] is always the sender; exclude own messages and already-read ones
        (m) => m.readBy[0] !== userIdStr && !m.readBy.includes(userIdStr),
    ).length;
}
