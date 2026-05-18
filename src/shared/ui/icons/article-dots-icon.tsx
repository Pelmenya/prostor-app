/**
 * ArticleDotsIcon — 6-точечный glyph для chip «По артикулу» в smart-search.
 *
 * Источник: claude.ai design uplift mockup 2026-05-18, файл
 * `public/smart-search-polish-2026-05-18.html` (извлечён через DevTools
 * inspect chip "По артикулу"). Дизайнер представил артикул товара как
 * dot-matrix / штрих-код-like pattern — 2 колонки × 3 строки точек,
 * связано с QR-style визуальным языком SKU.
 *
 * Heroicons эквивалента нет; `HashtagIcon (#)` использовался в iter2 как
 * placeholder, был визуально нерелевантен. `Squares2X2Icon` (2×2 squares)
 * был proxy-вариант slovo но визуально не совпадает.
 *
 * ViewBox 0 0 12 12 — квадратный, fit под Tailwind `size-N` классы.
 * Centered 2-column layout (x=4, x=8), 3 rows (y=2, y=6, y=10), r=1.
 */

type TProps = {
    className?: string;
};

export function ArticleDotsIcon({ className }: TProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <circle cx="4" cy="2" r="1" />
            <circle cx="8" cy="2" r="1" />
            <circle cx="4" cy="6" r="1" />
            <circle cx="8" cy="6" r="1" />
            <circle cx="4" cy="10" r="1" />
            <circle cx="8" cy="10" r="1" />
        </svg>
    );
}
