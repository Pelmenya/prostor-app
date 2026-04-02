'use client';

import type { TTabType } from '../../lib/tab-status-presets';

type TOrdersTabSwitcherProps = {
    activeTab: TTabType;
    onTabChange: (tab: TTabType) => void;
    actualCount?: number;
    completedCount?: number;
    isActualCountLoading?: boolean;
    isCompletedCountLoading?: boolean;
};

function CountBadge({ count, isLoading }: { count?: number; isLoading?: boolean }) {
    if (isLoading) {
        return <span className="loading loading-dots loading-xs" />;
    }
    if (count === undefined) return null;
    return (
        <span className="badge badge-xs badge-neutral">
            {count}
        </span>
    );
}

export function OrdersTabSwitcher({
    activeTab,
    onTabChange,
    actualCount,
    completedCount,
    isActualCountLoading,
    isCompletedCountLoading,
}: TOrdersTabSwitcherProps) {
    return (
        <div role="tablist" className="tabs tabs-border">
            <button
                role="tab"
                type="button"
                className={`tab ${activeTab === 'actual' ? 'tab-active' : ''}`}
                onClick={() => onTabChange('actual')}
            >
                <span className="inline-flex items-center gap-1">
                    Актуальные
                    <CountBadge count={actualCount} isLoading={isActualCountLoading} />
                </span>
            </button>
            <button
                role="tab"
                type="button"
                className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
                onClick={() => onTabChange('completed')}
            >
                <span className="inline-flex items-center gap-1">
                    Завершенные
                    <CountBadge count={completedCount} isLoading={isCompletedCountLoading} />
                </span>
            </button>
        </div>
    );
}
