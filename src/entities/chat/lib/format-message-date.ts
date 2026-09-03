import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatMessageDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isToday(dateObj)) return 'Сегодня';
    if (isYesterday(dateObj)) return 'Вчера';

    return format(dateObj, 'd MMMM', { locale: ru });
}
