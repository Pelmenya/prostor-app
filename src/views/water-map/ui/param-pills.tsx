'use client';

import { FEATURED_HEATMAP_PARAMS, type TWaterParam } from '@/entities/water-analysis';
import { paramLabel } from '../lib';

type TParamPillsProps = {
    selected: TWaterParam;
    onSelect: (p: TWaterParam) => void;
};

/**
 * Pill-toggle для 5 главных параметров heatmap (risk + 4 ключевых).
 * Горизонтальный scroll если pills не помещаются.
 *
 * Desktop affordance (slovo 2026-05-15 14:45):
 * - Fade-mask на правом edge — visual hint что есть hidden content за overflow
 * - Wheel-handler — mouse wheel deltaY скроллит horizontal (UA default
 *   only vertical, для horizontal scroll нужен JS bridge)
 */
export function ParamPills({ selected, onSelect }: TParamPillsProps) {
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.deltaY !== 0 && e.deltaX === 0) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    return (
        <div
            onWheel={handleWheel}
            className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-1 px-1 py-1 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]"
        >
            {FEATURED_HEATMAP_PARAMS.map((p) => {
                const active = p === selected;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onSelect(p)}
                        aria-pressed={active}
                        className={`shrink-0 min-h-11 px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center ${
                            active
                                ? 'bg-primary text-primary-content border-primary'
                                : 'bg-base-100 text-base-content/80 border-base-content/15 hover:border-primary/40'
                        }`}
                    >
                        {paramLabel(p)}
                    </button>
                );
            })}
        </div>
    );
}
