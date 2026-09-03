'use client';

import { ClockIcon } from '@heroicons/react/24/outline';
import { useSmartSearchStore } from '../../model/smart-search.store';

type TProps = {
    onPick: (query: string) => void;
};

export function RecentSearchesList({ onPick }: TProps) {
    const recent = useSmartSearchStore((s) => s.recentQueries);
    const clear = useSmartSearchStore((s) => s.clearRecentQueries);

    if (recent.length === 0) return null;

    return (
        <section aria-label="Недавние поиски">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                    Недавние поиски
                </h4>
                <button
                    type="button"
                    onClick={clear}
                    className="text-xs text-base-content/40 hover:text-base-content/70 transition cursor-pointer"
                >
                    Очистить
                </button>
            </div>
            <ul className="flex flex-col gap-1">
                {recent.map((q) => (
                    <li key={q}>
                        <button
                            type="button"
                            onClick={() => onPick(q)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-base-200 text-left text-sm text-base-content/80 transition cursor-pointer"
                        >
                            <ClockIcon className="size-4 text-base-content/40 shrink-0" />
                            <span className="truncate">{q}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
