import { describe, it, expect } from 'vitest';
import { computeUnreadCount } from './compute-unread-count';
import type { TMessage } from '../model/t-message';

function makeMsg(id: string, senderId: number, readBy: string[] = []): TMessage {
    return {
        id,
        chatId: 'chat-1',
        senderId,
        sender: { id: senderId } as TMessage['sender'],
        type: 'TEXT',
        content: 'test',
        attachments: [],
        readBy,
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as unknown as TMessage;
}

describe('computeUnreadCount', () => {
    it('0 если нет сообщений', () => {
        expect(computeUnreadCount([], 1)).toBe(0);
    });

    it('0 если все прочитаны', () => {
        const msgs = [makeMsg('1', 2, ['1']), makeMsg('2', 2, ['1'])];
        expect(computeUnreadCount(msgs, 1)).toBe(0);
    });

    it('считает только сообщения от других', () => {
        const msgs = [
            makeMsg('1', 2, []), // от другого, не прочитано → +1
            makeMsg('2', 1, []), // своё → не считается
            makeMsg('3', 2, ['1']), // от другого, прочитано → 0
        ];
        expect(computeUnreadCount(msgs, 1)).toBe(1);
    });

    it('несколько непрочитанных', () => {
        const msgs = [makeMsg('1', 2, []), makeMsg('2', 3, []), makeMsg('3', 2, [])];
        expect(computeUnreadCount(msgs, 1)).toBe(3);
    });

    it('senderId в readBy хранится как строка', () => {
        // senderId: number, readBy: string[] — убеждаемся что сравнение корректное
        const msgs = [makeMsg('1', 2, ['1', '5'])];
        expect(computeUnreadCount(msgs, 1)).toBe(0);
    });
});
