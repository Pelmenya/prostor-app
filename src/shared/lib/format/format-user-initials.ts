export function formatUserInitials(firstName?: string, lastName?: string): string {
    return (firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '') || '?';
}
