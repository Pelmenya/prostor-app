'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/20/solid';
import type { TCategoryAvg } from '@/shared/model';

type TCategoryCollapseProps = {
    category: TCategoryAvg;
    criterionLabels: Record<string, string>;
};

export function CategoryCollapse({ category, criterionLabels }: TCategoryCollapseProps) {
    const [isOpen, setIsOpen] = useState(false);

    const avg = Math.min(Math.max(category.avg, 0), 5);

    return (
        <div className="border border-base-200 rounded-xl overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4 bg-base-100 hover:bg-base-200 transition-colors"
                onClick={() => setIsOpen((v) => !v)}
            >
                <div className="flex items-center gap-2">
                    <StarIcon className="size-4 text-warning" />
                    <span className="font-medium text-sm">{category.key}</span>
                    <span className="text-xs text-base-content/50">({category.count})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-warning">
                        {avg.toLocaleString('ru-RU', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                        })}
                    </span>
                    <ChevronDownIcon
                        className={`size-4 text-base-content/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {isOpen && category.criteria.length > 0 && (
                <div className="border-t border-base-200 divide-y divide-base-200">
                    {category.criteria.map((criterion) => {
                        const criterionAvg = Math.min(Math.max(criterion.avg, 0), 5);
                        return (
                            <div
                                key={criterion.key}
                                className="flex items-center justify-between px-4 py-2.5 bg-base-100"
                            >
                                <span className="text-sm text-base-content/70">
                                    {criterionLabels[criterion.key] ?? criterion.key}
                                </span>
                                <div className="flex items-center gap-1">
                                    <StarIcon className="size-3 text-warning" />
                                    <span className="text-xs font-medium">
                                        {criterionAvg.toLocaleString('ru-RU', {
                                            minimumFractionDigits: 1,
                                            maximumFractionDigits: 1,
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
