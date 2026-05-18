'use client';

import { CameraIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { WaterDrop } from '@/shared/ui';
import { useSmartSearchStore } from '../../model/smart-search.store';

/**
 * Sticky search entry-point под slim header pill на water-map-page.
 *
 * Design uplift 2026-05-18 (Artifact 3) — visually dominant:
 *  - gradient border wrapper (subtle OKLCH brand-primary→secondary, p-px)
 *  - inline AI sparkle badge внутри (визуальный AI-маркер)
 *  - gradient circle camera button справа (как в overlay header)
 *
 * Layout: absolute centered on mobile, left-aligned за LayerPanel на desktop
 * (≥lg, lg:left-[24rem]). Top:4rem под slim header pill (которая на top:1rem
 * + h~2rem = 3rem с 1rem gap).
 */
export function SmartSearchInput() {
    const open = useSmartSearchStore((s) => s.openOverlay);

    return (
        <div
            className="pointer-events-auto absolute left-2 right-2 z-20 lg:left-[24rem] lg:right-4 lg:max-w-md"
            style={{ top: 'calc(env(safe-area-inset-top, 0) + 4rem)' }}
        >
            {/* Gradient border wrapper — outer p-px ring создаёт illusion цветного
                border'а без border-image (поддержка лучше у Safari). */}
            <div className="rounded-xl p-px bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/40 shadow-md">
                <button
                    type="button"
                    onClick={open}
                    className="w-full flex items-center gap-2 h-11 pl-3 pr-1 rounded-[11px] bg-base-100/95 backdrop-blur-md text-left text-base-content/70 hover:text-base-content transition cursor-pointer"
                    aria-label="Открыть умный поиск товаров"
                >
                    <WaterDrop size={20} />
                    <MagnifyingGlassIcon className="size-4 text-base-content/40 shrink-0" />
                    <span className="flex-1 truncate text-sm">Умный поиск · текст или фото</span>
                    {/* AI badge — sparkle + label, primary-content на gradient bg. Even smaller
                        gradient strip но визуально показывает что это AI-feature, не plain поиск. */}
                    <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-primary-content bg-gradient-to-r from-primary to-secondary shrink-0"
                        aria-hidden="true"
                    >
                        <SparklesIcon className="size-2.5" />
                        AI
                    </span>
                    {/* Camera button — gradient circle (consistency со overlay camera).
                        Размер совпадает с inputBar height-1 (40px = h-11 - 2*p-0.5). */}
                    <span
                        className="size-9 inline-flex items-center justify-center rounded-lg text-primary-content bg-gradient-to-br from-primary to-secondary shadow-sm shrink-0"
                        aria-hidden="true"
                    >
                        <CameraIcon className="size-5" />
                    </span>
                </button>
            </div>
        </div>
    );
}
