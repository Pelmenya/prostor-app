import { S3_PUBLIC_URL } from '@/shared/config';

export function getStorageUrl(path: string | undefined | null): string {
    if (!path) return '';
    // Only prepend S3 base for relative paths
    if (path.startsWith('/') || !path.includes('://')) return `${S3_PUBLIC_URL}/${path}`;
    return path;
}
