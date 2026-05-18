'use client';

import { CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { WaterDrop } from '@/shared/ui';
import { useSmartSearchStore } from '../../model/smart-search.store';

/**
 * Sticky search entry-point под top-bar на water-map-page. Заменяет FTUX hint
 * card как mandate Phase 1. Не выполняет search сам — открывает overlay при
 * любом взаимодействии (click / focus / camera tap).
 *
 * Layout: absolute positioned внутри water-map-page (carrier — relative
 * `data-fullscreen-map` div). top:56px (под top-bar h-14), left/right с
 * gap 0.5rem на mobile. На desktop (≥lg) сдвинуто за LayerPanel (left:24rem).
 *
 * Glass-style унифицирован с другими map controls (zoom + Слои FAB + SimilarFab).
 */
export function SmartSearchInput() {
    const open = useSmartSearchStore((s) => s.openOverlay);

    return (
        <div
            className="pointer-events-auto absolute left-2 right-2 z-20 lg:left-[24rem] lg:right-4 lg:max-w-md"
            style={{ top: 'calc(env(safe-area-inset-top, 0) + 4rem)' }}
        >
            <button
                type="button"
                onClick={open}
                className="w-full flex items-center gap-2 h-11 pl-3 pr-2 rounded-xl bg-base-100/95 backdrop-blur-md border border-base-content/10 shadow-md text-left text-base-content/70 hover:text-base-content hover:border-primary/30 transition cursor-pointer"
                aria-label="Открыть умный поиск товаров"
            >
                <WaterDrop size={20} />
                <MagnifyingGlassIcon className="size-4 text-base-content/40 shrink-0" />
                <span className="flex-1 truncate text-sm">Умный поиск · текст или фото</span>
                <span
                    className="size-8 inline-flex items-center justify-center rounded-md text-primary"
                    aria-hidden="true"
                >
                    <CameraIcon className="size-5" />
                </span>
            </button>
        </div>
    );
}
