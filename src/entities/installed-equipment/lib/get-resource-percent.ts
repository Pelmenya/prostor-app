/**
 * Возвращает оставшийся ресурс компонента (0–100%).
 * ≥50% — зелёный, 20–49% — жёлтый, <20% — красный.
 */
export function getResourcePercent(installedAt: string, nextReplacementDate: string): number {
    const start = new Date(installedAt).getTime();
    const end = new Date(nextReplacementDate).getTime();
    const now = Date.now();

    const total = end - start;
    if (total <= 0) return 0;

    const remaining = end - now;
    return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
}

export function getProgressColor(percent: number): string {
    if (percent >= 50) return 'progress-success';
    if (percent >= 20) return 'progress-warning';
    return 'progress-error';
}

export function getDaysLeft(nextReplacementDate: string): number {
    const end = new Date(nextReplacementDate).getTime();
    const now = Date.now();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}
