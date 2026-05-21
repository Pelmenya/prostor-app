'use client';

import { CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { WaterDrop } from '@/shared/ui';
import { useSmartSearchStore } from '../../model/smart-search.store';

/**
 * Sticky search entry-point под slim header pill на water-map-page.
 *
 * Design uplift 2026-05-18 (Artifact 3) — visually dominant:
 *  - gradient border wrapper (subtle OKLCH brand-primary→secondary, p-px)
 *  - gradient circle camera button справа (как в overlay header)
 *
 * Layout: absolute mobile `left-4 right-16` (освобождает 56px справа под
 * `RightSideToolbar`). На desktop reactive к `layersOpen`: panel open →
 * `lg:left-[24rem]` (за sidebar), panel closed → `lg:left-4` (у viewport
 * edge). Transition smooth, group с другими left-anchored controls
 * (WaterMapTopBar pill, AutoEquipmentCard slim bar).
 */
type TProps = {
    /** LayerPanel open state — на lg сдвигает input за sidebar при open */
    layersOpen?: boolean;
};

export function SmartSearchInput({ layersOpen }: TProps) {
    const open = useSmartSearchStore((s) => s.openOverlay);

    return (
        <div
            className={`pointer-events-auto absolute left-4 right-[4.25rem] z-20 lg:right-4 lg:max-w-md transition-[left] duration-300 ease-out ${
                layersOpen ? 'lg:left-[24rem]' : 'lg:left-4'
            }`}
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
