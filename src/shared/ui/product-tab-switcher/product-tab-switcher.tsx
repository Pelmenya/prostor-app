export type TProductTabType = 'buy' | 'installation' | 'service';

type TProductTabSwitcherProps = {
    activeTab: TProductTabType;
    onTabChange: (tab: TProductTabType) => void;
    hasInstallationServices: boolean;
    hasServiceServices: boolean;
};

type TTabConfig = {
    id: TProductTabType;
    label: string;
    isVisible: boolean;
};

export function ProductTabSwitcher({
    activeTab,
    onTabChange,
    hasInstallationServices,
    hasServiceServices,
}: TProductTabSwitcherProps) {
    const tabs: TTabConfig[] = [
        { id: 'buy', label: 'Купить', isVisible: true },
        { id: 'installation', label: 'Монтаж', isVisible: hasInstallationServices },
        { id: 'service', label: 'Сервис', isVisible: hasServiceServices },
    ];

    return (
        <div role="tablist" className="tabs tabs-border mt-4 lg:mt-6">
            {tabs
                .filter((tab) => tab.isVisible)
                .map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
        </div>
    );
}
