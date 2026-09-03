'use client';

import { cn } from '@/shared/lib';
import type { TTabType } from '../lib/tab-status-presets';

type TOrdersTabSwitcherProps = {
    activeTab: TTabType;
    onTabChange: (tab: TTabType) => void;
    actualCount?: number;
    completedCount?: number;
    isActualCountLoading?: boolean;
    isCompletedCountLoading?: boolean;
    actualLabel?: string;
    completedLabel?: string;
};

function CountBadge({ count, isLoading }: { count?: number; isLoading?: boolean }) {
    if (isLoading) {
        return <span className="loading loading-dots loading-xs" />;
    }
    if (count === undefined) return null;
    return <span className="badge badge-xs badge-neutral">{count}</span>;
}

export function OrdersTabSwitcher({
    activeTab,
    onTabChange,
    actualCount,
    completedCount,
    isActualCountLoading,
    isCompletedCountLoading,
    actualLabel = 'Актуальные',
    completedLabel = 'Завершенные',
}: TOrdersTabSwitcherProps) {
    return (
        <div role="tablist" className="tabs tabs-border">
            <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'actual'}
                className={cn('tab', activeTab === 'actual' && 'tab-active')}
                onClick={() => onTabChange('actual')}
            >
                <span className="inline-flex items-center gap-1">
                    {actualLabel}
                    <CountBadge count={actualCount} isLoading={isActualCountLoading} />
                </span>
            </button>
            <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'completed'}
                className={cn('tab', activeTab === 'completed' && 'tab-active')}
                onClick={() => onTabChange('completed')}
            >
                <span className="inline-flex items-center gap-1">
                    {completedLabel}
                    <CountBadge count={completedCount} isLoading={isCompletedCountLoading} />
                </span>
            </button>
        </div>
    );
}
