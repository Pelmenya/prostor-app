'use client';

const IS_CLIENT = typeof window !== 'undefined';

export function usePwaDetect() {
    if (!IS_CLIENT) {
        return { isIos: false, isStandalone: false, showInstallHint: false };
    }

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
        'standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone;

    return {
        isIos,
        isStandalone,
        showInstallHint: isIos && !isStandalone,
    };
}
