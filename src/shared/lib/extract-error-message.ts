/**
 * Извлекает строку ошибки из ответа бэкенда.
 * NestJS class-validator возвращает { message: string | string[] }.
 */
export function extractErrorMessage(data: unknown, fallback: string): string {
    if (!data || typeof data !== 'object') return fallback;
    const d = data as Record<string, unknown>;
    if (typeof d.message === 'string') return d.message;
    if (Array.isArray(d.message) && d.message.length > 0) {
        return typeof d.message[0] === 'string' ? d.message[0] : fallback;
    }
    return fallback;
}
