/**
 * PROSTOR brand mark — капля воды + sparkle (AI-маркер).
 * Источник: claude design (Smart-Search mockup, май 2026).
 *
 * Используется как:
 * - bottom-nav вкладка «Вода» (FAB или обычная, props.variant)
 * - FAB на карте качества воды
 * - empty-state маркер AI-помощника
 * - header AI-features
 *
 * Sparkle анимация (props.animated=true) — keyframe `wdspark`
 * (определён в src/app/globals.css). Лёгкое «дыхание» 2.4s ease-in-out.
 */

type TWaterDropProps = {
    /**
     * Размер иконки в px. Если не задан — наследует размер от родителя через
     * CSS (как heroicons), полезно для footer/header где контейнер задаёт size.
     * Явный size нужен в empty-state / onboarding (рекомендуемые: 48 / 72).
     */
    size?: number;
    /** Анимация sparkle (медленный pulse 2.4s). Используй для filled на FAB / hero. */
    animated?: boolean;
    /**
     * Вариант:
     * - `filled` (default) — brand-mark с gradient + sparkle. Использовать в hero,
     *   FAB на карте, empty-state, header AI-features. Это «настоящая» капля.
     * - `outline` — monochrome stroke в стиле heroicons. Использовать в footer-nav
     *   и других местах где нужна standard-icon с currentColor (наследует тему).
     */
    variant?: 'filled' | 'outline';
    /** Дополнительные классы */
    className?: string;
};

// Фиксированные id для SVG defs — все WaterDrop экземпляры имеют идентичные
// gradient/shine, поэтому дубликаты не создают конфликта (последний defs
// перезаписывает предыдущий с тем же значением). SSR-friendly: нет Math.random
// вызывающего hydration mismatch, не нужен useId хук.
const GRAD_ID = 'wd-grad';
const SHINE_ID = 'wd-shine';

export function WaterDrop({
    size,
    animated = false,
    variant = 'filled',
    className = '',
}: TWaterDropProps) {
    // Размер: если задан явно — width/height в px (для empty-state/hero).
    // Если нет — наследуется от parent через CSS (как heroicons SVG).
    const sizeProps: Record<string, string | number> = size
        ? { width: size, height: size }
        : { width: '100%', height: '100%' };

    if (variant === 'outline') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...sizeProps}
            >
                <path d="M24 4 C30 12 38 18 38 28 a14 14 0 1 1-28 0 c0-10 8-16 14-24z" />
            </svg>
        );
    }

    // Класс waterdrop-anim на SVG — opt-in для CSS-анимации `.waterdrop-anim .wd-spark`
    // (определена в src/app/globals.css). Без него sparkle статичен.
    const filledClassName = animated ? `waterdrop-anim ${className}`.trim() : className;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className={filledClassName}
            {...sizeProps}
        >
            <defs>
                <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(72% 0.16 232)" />
                    <stop offset="55%" stopColor="oklch(58% 0.22 250)" />
                    <stop offset="100%" stopColor="oklch(48% 0.26 270)" />
                </linearGradient>
                <radialGradient id={SHINE_ID} cx="35%" cy="30%" r="40%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
            </defs>
            <path
                d="M24 4 C30 12 38 18 38 28 a14 14 0 1 1-28 0 c0-10 8-16 14-24z"
                fill={`url(#${GRAD_ID})`}
            />
            <ellipse
                cx="18"
                cy="20"
                rx="5"
                ry="8"
                fill={`url(#${SHINE_ID})`}
                transform="rotate(-25 18 20)"
            />
            {/* Класс wd-spark всегда — анимация подключается только когда родительский
                SVG имеет .waterdrop-anim (см. CSS rule). */}
            <g className="wd-spark">
                <path
                    d="M24 24 L25.5 27 L28.5 28 L25.5 29 L24 32 L22.5 29 L19.5 28 L22.5 27 z"
                    fill="white"
                    opacity="0.95"
                />
                <circle cx="30" cy="22" r="0.9" fill="white" opacity="0.85" />
                <circle cx="19" cy="33" r="0.7" fill="white" opacity="0.7" />
            </g>
        </svg>
    );
}
