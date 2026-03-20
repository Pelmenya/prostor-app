/**
 * Форматирует цену из копеек в рубли с разделителями.
 * МойСклад хранит цены в копейках (value / 100).
 */
export function formatPrice(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(value / 100);
}
