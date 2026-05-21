import type { TPdkStatus } from '@/entities/water-analysis';
import { SEVERITY_VISUALS, severityLabel } from '../lib';

type TSeverityBadgeProps = {
    status: TPdkStatus | 'unmonitored' | null;
    /** Размер: sm для inline-бейджа, md для секций. */
    size?: 'sm' | 'md';
    /** Показывать только цветную точку без текста (для compact list-item). */
    dotOnly?: boolean;
    /** Свой текст вместо стандартного из severityLabel. */
    children?: React.ReactNode;
};

/**
 * Цветовой бейдж по severity-уровню (4 + unmonitored).
 * Используется в predict-modal headers секций, equipment-suggest problem-cards,
 * popup'ах cell.
 */
export function SeverityBadge({ status, size = 'md', dotOnly, children }: TSeverityBadgeProps) {
    const v = SEVERITY_VISUALS[status ?? 'unmonitored'];
    const label =
        children ??
        (status && status !== ('unmonitored' as TPdkStatus)
            ? severityLabel(status as TPdkStatus)
            : 'Не нормируется');
    const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

    if (dotOnly) {
        return (
            <span
                className={`inline-block size-2 rounded-full ${v.dot}`}
                aria-label={String(label)}
            />
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full ring-1 ${v.bg} ${v.text} ${v.ring} ${sizeCls} font-medium`}
        >
            <span className={`inline-block size-1.5 rounded-full ${v.dot}`} />
            {label}
        </span>
    );
}
