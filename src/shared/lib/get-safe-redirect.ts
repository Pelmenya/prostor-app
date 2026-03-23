export function getSafeRedirect(from: string | null): string {
    if (!from) return '/';
    if (!from.startsWith('/') || from.startsWith('//')) return '/';
    return from;
}
