import { S3_PUBLIC_URL } from '@/shared/config';

export function getStorageUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${S3_PUBLIC_URL}/${path}`;
}
