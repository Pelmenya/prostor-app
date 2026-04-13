/**
 * Сериализует объект параметров в строку запроса.
 *
 * Поведение по значению:
 * - `undefined` / `''` — пропускается (параметр не добавляется)
 * - `null` — кодируется как строка `"null"`. Намеренно: NestJS ValidationPipe
 *   принимает `"null"` как сигнал явного сброса параметра. Убедитесь, что бэкенд
 *   ожидает именно строку, а не отсутствие ключа.
 * - `Array` — каждый элемент добавляется отдельной парой: `status=pending&status=confirmed`
 * - Остальное — `String(value)`
 */
export function buildSearchParams(params: Record<string, unknown>): string {
    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === '') continue;

        // null передаётся как строка "null" — намеренно, для явной передачи «сброса» параметра.
        // Убедиться, что бэкенд ожидает именно строку "null", а не отсутствие параметра.
        if (value === null) {
            urlParams.append(key, 'null');
            continue;
        }

        if (Array.isArray(value)) {
            if (value.length > 0) {
                for (const val of value) {
                    urlParams.append(key, String(val));
                }
            }
        } else {
            urlParams.append(key, String(value));
        }
    }

    return urlParams.toString();
}
