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
