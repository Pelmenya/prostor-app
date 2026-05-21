'use client';

/**
 * Slim header pill «● 15 504 анализа · Москва и Подмосковье».
 *
 * Design uplift 2026-05-18 (Artifact 3): заменяет большую title-card с
 * подписью «Карта качества воды» — она дублировала вкладку «Вода» в
 * bottom-nav и съедала viewport карты. Слои-button мигрирован в
 * `RightSideToolbar` (вместе с Zoom +/− grouped).
 *
 * Position: absolute top-left, left-4 везде (mobile) / на desktop —
 * reactive к `layersOpen`: panel open → отъезжает за sidebar (24rem),
 * panel closed → у viewport edge (left-4). Transition smooth, group
 * с другими left-anchored controls (SmartSearchInput, AutoEquipmentCard).
 */
type TWaterMapTopBarProps = {
    /** Текстовый счётчик «N анализа» (опц.). */
    subtitle?: string;
    /** LayerPanel open state — на lg сдвигает pill за sidebar при open */
    layersOpen?: boolean;
};

export function WaterMapTopBar({ subtitle, layersOpen }: TWaterMapTopBarProps) {
    return (
        <div
            className={`pointer-events-none absolute left-4 z-10 transition-[left] duration-300 ease-out ${
                layersOpen ? 'lg:left-[24rem]' : 'lg:left-4'
            }`}
            style={{ top: 'calc(env(safe-area-inset-top, 0) + 1rem)' }}
        >
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-base-100/95 backdrop-blur-md shadow-md border border-base-content/10 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-success animate-pulse" aria-hidden />
                <span className="text-xs font-medium text-base-content/85 whitespace-nowrap">
                    {subtitle ?? '15 504 анализа'}
                </span>
            </div>
        </div>
    );
}
