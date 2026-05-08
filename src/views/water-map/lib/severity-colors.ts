import type { TPdkStatus } from '@/entities/water-analysis';

/**
 * Mapping TPdkStatus → daisyui semantic colors. 4 уровня + null (unmonitored).
 *
 * `concerning` — нет прямого daisyui-колора между warning и error, поэтому
 * inline oklch (orange). Остальные — semantic tokens (live с темой).
 */
export type TSeverityVisual = {
    /** bg для бейджа / иконки. */
    bg: string;
    /** text-color для бейджа. */
    text: string;
    /** ring/border. */
    ring: string;
    /** Маленькая «pill» цветная точка (для list items). */
    dot: string;
    /** Заголовок секции в predict-modal. */
    sectionLabel: string;
    /** Иконка emoji-style (для визуальной шкалы). */
    iconText: string;
};

const ORANGE = 'oklch(70% 0.18 40)';
const ORANGE_CONTENT = 'oklch(98% 0.02 40)';

export const SEVERITY_VISUALS: Record<TPdkStatus | 'unmonitored', TSeverityVisual> = {
    safe: {
        bg: 'bg-success/15',
        text: 'text-success',
        ring: 'ring-success/30',
        dot: 'bg-success',
        sectionLabel: 'В норме',
        iconText: '✓',
    },
    borderline: {
        bg: 'bg-warning/15',
        text: 'text-warning',
        ring: 'ring-warning/30',
        dot: 'bg-warning',
        sectionLabel: 'На границе',
        iconText: '!',
    },
    concerning: {
        // Нет прямого daisyui-токена для orange — inline oklch + Tailwind arbitrary.
        bg: '[background-color:oklch(70%_0.18_40_/_0.18)]',
        text: '[color:oklch(56%_0.18_40)]',
        ring: '[--tw-ring-color:oklch(70%_0.18_40_/_0.4)]',
        dot: `[background-color:${ORANGE}]`,
        sectionLabel: 'Вероятные проблемы',
        iconText: '!',
    },
    unsafe: {
        bg: 'bg-error/15',
        text: 'text-error',
        ring: 'ring-error/30',
        dot: 'bg-error',
        sectionLabel: 'Срочные проблемы',
        iconText: '✗',
    },
    unmonitored: {
        bg: 'bg-base-300',
        text: 'text-base-content/60',
        ring: 'ring-base-content/10',
        dot: 'bg-base-content/30',
        sectionLabel: 'Не нормируется',
        iconText: '–',
    },
};

/**
 * Inline orange color (для случаев где нужен прямой hex/oklch — например maplibre paint).
 */
export const CONCERNING_COLOR = ORANGE;
export const CONCERNING_CONTENT = ORANGE_CONTENT;

/**
 * Human-readable label для severity 4-level (без unmonitored).
 */
export function severityLabel(status: TPdkStatus): string {
    return SEVERITY_VISUALS[status].sectionLabel;
}

/**
 * Severity-icon приоритет (для сортировки problems по urgency).
 * unsafe(3) > concerning(2) > borderline(1) > safe(0).
 */
export function severityWeight(status: TPdkStatus | null): number {
    if (status === 'unsafe') return 3;
    if (status === 'concerning') return 2;
    if (status === 'borderline') return 1;
    return 0;
}
