'use client';

import { FEATURED_HEATMAP_PARAMS, type TWaterParam } from '@/entities/water-analysis';
import { paramLabel } from '../lib';

type TParamPillsProps = {
    selected: TWaterParam;
    onSelect: (p: TWaterParam) => void;
};

/**
 * Pill-toggle для 5 главных параметров heatmap (risk + 4 ключевых).
 * Горизонтальный scroll на mobile если нужно.
 */
export function ParamPills({ selected, onSelect }: TParamPillsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-1 px-1 py-1">
            {FEATURED_HEATMAP_PARAMS.map((p) => {
                const active = p === selected;
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onSelect(p)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
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
