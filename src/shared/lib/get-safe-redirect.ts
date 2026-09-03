export function getSafeRedirect(from: string | null): string {
    if (!from) return '/';
    if (!from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return '/';
    if (from.toLowerCase().startsWith('javascript:')) return '/';
    return from;
}
