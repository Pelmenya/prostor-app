export function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function toTimeStr(h: number, m: number): string {
    return `${pad(h)}:${pad(m)}`;
}

export function fromTimeStr(t: string): { h: number; m: number } {
    const [h, m] = t.split(':').map(Number);
    return { h: h ?? 0, m: m ?? 0 };
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
}
