const RU_TO_LAT: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
};

/**
 * Генерирует URL-slug из названия.
 * Формула совпадает с бэком (shared/helpers/transliterate.ts)
 */
export function generateSlug(name: string, id: string): string {
    const transliterated = name
        .toLowerCase()
        .split('')
        .map((char) => RU_TO_LAT[char] ?? char)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const shortId = id.replace(/-/g, '').substring(0, 4);

    return `${transliterated}-${shortId}`;
}
