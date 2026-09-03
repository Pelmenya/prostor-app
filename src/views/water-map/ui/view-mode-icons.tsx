/**
 * View-mode icons — 3 SVG glyph'а для radio-group `ViewModeToggle` cells
 * на /water (replaces Unicode «✨ ● ◉»).
 *
 * Источник: claude.ai design uplift mockup 2026-05-18, файл
 * `public/smart-search-polish-2026-05-18.html` Artifact 2 «LayerPanel radio
 * 3-glyph set» (извлечены через Playwright `browser_evaluate`).
 *
 * - SplineGlyph — smooth blob с inner contour (сглаженная density)
 * - DotsGlyph — 8 scattered circles разного диаметра (individual анализы)
 * - BothGlyph — blob + mix filled/outline circles (combined view)
 *
 * Все viewBox 0 0 24 24, currentColor stroke. Size через prop (default 18px
 * под inline radio-button context, 16/20/24 для других contexts по дизайну).
 */

type TGlyphProps = {
    size?: number;
    className?: string;
};

export function SplineGlyph({ size = 18, className }: TGlyphProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {/* Внешний blob */}
            <path d="M3.6 14 C 2.6 9, 7.5 4.5, 11 6.5 C 14.5 3.6, 21 6.2, 20.4 12 C 21.4 18, 13.5 20, 11.5 18.5 C 7 20, 3 17.5, 3.6 14 Z" />
            {/* Inner contour — visual density */}
            <path
                d="M8 13 C 8 10.5, 11 9, 13 10 C 15 9.5, 17 11.5, 16.5 13.5 C 16.5 16, 13 16.5, 11.5 15.5 C 10 16.5, 8 15.5, 8 13 Z"
                opacity="0.45"
            />
        </svg>
    );
}

export function DotsGlyph({ size = 18, className }: TGlyphProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
            aria-hidden="true"
        >
            <circle cx="7" cy="7" r="1.5" />
            <circle cx="12" cy="5" r="1.4" />
            <circle cx="17" cy="8" r="1.5" />
            <circle cx="6" cy="13" r="1.4" />
            <circle cx="13" cy="11" r="1.6" />
            <circle cx="18" cy="14" r="1.4" />
            <circle cx="9" cy="17" r="1.5" />
            <circle cx="15" cy="18" r="1.4" />
        </svg>
    );
}

export function BothGlyph({ size = 18, className }: TGlyphProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {/* Blob (background, прозрачнее) */}
            <path
                d="M3.6 14 C 2.6 9, 7.5 4.5, 11 6.5 C 14.5 3.6, 21 6.2, 20.4 12 C 21.4 18, 13.5 20, 11.5 18.5 C 7 20, 3 17.5, 3.6 14 Z"
                opacity="0.55"
            />
            {/* 3 filled circles (currentColor) */}
            <circle cx="8" cy="9" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="16" cy="11" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" />
            {/* 3 outline circles (white fill, currentColor stroke) */}
            <circle cx="13" cy="8" r="1.5" fill="#fff" />
            <circle cx="10" cy="13" r="1.4" fill="#fff" />
            <circle cx="9" cy="17" r="1.4" fill="#fff" />
        </svg>
    );
}
