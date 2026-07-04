/**
 * Иконка Telegram — «бумажный самолётик».
 *
 * Monochrome outline (currentColor), без brand-blue #26A5E4 — используется
 * как визуальный маркер disabled-кнопки «Войти через Telegram» на экране
 * входа. НЕ имеет варианта filled/gradient — только стандартный stroke-icon
 * в стиле остальных icons/ (см. water-drop.tsx variant="outline").
 */

type TTelegramIconProps = {
    /** Размер иконки в px. Если не задан — наследует размер от родителя (100%). */
    size?: number;
    /** Дополнительные классы */
    className?: string;
};

export function TelegramIcon({ size, className = '' }: TTelegramIconProps) {
    const sizeProps: Record<string, string | number> = size
        ? { width: size, height: size }
        : { width: '100%', height: '100%' };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...sizeProps}
        >
            <path d="M21 4.5 3 11.2c-.9.35-.9 1.63.02 1.95l4.4 1.5 1.68 5.4c.28.9 1.42 1.1 2 .35l2.4-3.1 4.6 3.4c.78.58 1.9.15 2.1-.8L23 5.4c.2-1-.8-1.8-2-1.4Z" />
            <path d="m8.42 14.65 9.4-8.4-11 6.55" />
        </svg>
    );
}

export type { TTelegramIconProps };
