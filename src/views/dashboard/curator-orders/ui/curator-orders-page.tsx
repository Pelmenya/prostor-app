'use client';

import { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
    useGetOrders,
    useGetOrdersCount,
    EOrderStatus,
    OrderStatus,
    STATUS_LABEL,
} from '@/entities/order';
import { useGetCuratorMasters } from '@/entities/user';
import { OrdersTabSwitcher, TAB_STATUS_PRESETS } from '@/features/orders';
import type { TTabType } from '@/features/orders';
import { curatorOrderPath, CURATOR_ORDERS_PATH } from '@/shared/config';
import { formatDateRu, cn } from '@/shared/lib';
import {
    PageContainer,
    DashboardBackHeader,
    QueryBoundary,
    InfiniteList,
    BottomSheetModal,
} from '@/shared/ui';
import type { TOrder } from '@/entities/order';

type TActiveFilters = {
    statusOverride: EOrderStatus[] | null;
    executorId: number | null;
    sortDir: 'asc' | 'desc';
};

const DEFAULT_FILTERS: TActiveFilters = {
    statusOverride: null,
    executorId: null,
    sortDir: 'desc',
};

const ALL_STATUSES: EOrderStatus[] = [
    EOrderStatus.PENDING,
    EOrderStatus.CONFIRMED,
    EOrderStatus.IN_PROGRESS,
    EOrderStatus.COMPLETED,
    EOrderStatus.CANCELLED,
];

function parseStatusParam(raw: string | null): EOrderStatus | null {
    if (!raw) return null;
    return ALL_STATUSES.includes(raw as EOrderStatus) ? (raw as EOrderStatus) : null;
}

function countActiveFilters(filters: TActiveFilters): number {
    let count = 0;
    if (filters.statusOverride !== null) count++;
    if (filters.executorId !== null) count++;
    if (filters.sortDir !== 'desc') count++;
    return count;
}

export function CuratorOrdersPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки заказов">
            <Suspense>
                <CuratorOrdersContent />
            </Suspense>
        </QueryBoundary>
    );
}

function CuratorOrdersContent() {
    const searchParams = useSearchParams();
    const urlStatus = parseStatusParam(searchParams.get('status'));

    const [activeTab, setActiveTab] = useState<TTabType>('actual');
    const [filters, setFilters] = useState<TActiveFilters>(() => ({
        ...DEFAULT_FILTERS,
        statusOverride: urlStatus ? [urlStatus] : null,
    }));
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const effectiveStatuses = filters.statusOverride ?? [...TAB_STATUS_PRESETS[activeTab]];

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders({
        limit: 20,
        status: effectiveStatuses,
        executorId: filters.executorId ?? undefined,
        sortDir: filters.sortDir,
    });

    const { data: countData } = useGetOrdersCount({ status: effectiveStatuses });
    const orders = data.pages.flatMap((p) => p.items);
    const activeFilterCount = countActiveFilters(filters);

    function handleTabChange(tab: TTabType) {
        startTransition(() => {
            setActiveTab(tab);
            setFilters((prev) => ({ ...prev, statusOverride: null }));
        });
    }

    function handleApplyFilters(next: TActiveFilters) {
        startTransition(() => setFilters(next));
        setIsFilterOpen(false);
    }

    function handleRemoveFilter(key: keyof TActiveFilters) {
        startTransition(() => setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] })));
    }

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader
                title="Заказы"
                fallbackHref={CURATOR_ORDERS_PATH}
                right={
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        className="btn btn-ghost btn-sm btn-circle relative"
                        aria-label="Фильтры"
                    >
                        <FunnelIcon className="size-5" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 badge badge-xs badge-primary">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                }
            />

            <div
                className={cn(
                    'flex flex-col gap-3 max-w-lg mx-auto py-4',
                    isPending && 'opacity-60 transition-opacity',
                )}
            >
                {/* Табы — показываем только когда нет ручного фильтра по статусу */}
                {filters.statusOverride === null && (
                    <OrdersTabSwitcher
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        actualLabel="Активные"
                        completedLabel="Завершённые"
                    />
                )}

                {/* Активные фильтры-чипы */}
                <ActiveFilterChips filters={filters} onRemove={handleRemoveFilter} />

                {/* Счётчик результатов */}
                {countData?.count !== undefined && (
                    <p className="text-xs text-base-content/40 px-1">Найдено: {countData.count}</p>
                )}

                {orders.length === 0 ? (
                    <div className="card bg-base-100 p-6 text-center">
                        <p className="text-sm text-base-content/40">Заказов нет</p>
                    </div>
                ) : (
                    <InfiniteList
                        items={orders}
                        hasMore={!!hasNextPage}
                        isLoading={isFetchingNextPage}
                        onLoadMore={() => {
                            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                        }}
                        keyExtractor={(order) => order.id}
                        className="flex flex-col gap-2"
                        renderItem={(order) => <CuratorOrderCard order={order} />}
                    />
                )}
            </div>

            <FilterSheet
                isOpen={isFilterOpen}
                filters={filters}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
            />
        </PageContainer>
    );
}

// ─── Чипы активных фильтров ───────────────────────────────────────────────────

function ActiveFilterChips({
    filters,
    onRemove,
}: {
    filters: TActiveFilters;
    onRemove: (key: keyof TActiveFilters) => void;
}) {
    const chips: { key: keyof TActiveFilters; label: string }[] = [];

    if (filters.statusOverride !== null) {
        const labels = filters.statusOverride.map((s) => STATUS_LABEL[s]?.text ?? s);
        chips.push({ key: 'statusOverride', label: `Статус: ${labels.join(', ')}` });
    }
    if (filters.sortDir !== 'desc') {
        chips.push({ key: 'sortDir', label: 'Сначала старые' });
    }

    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 px-1">
            {chips.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onRemove(key)}
                    className="badge badge-outline gap-1 cursor-pointer"
                >
                    {label}
                    <XMarkIcon className="size-3" />
                </button>
            ))}
        </div>
    );
}

// ─── Карточка заказа ──────────────────────────────────────────────────────────

function CuratorOrderCard({ order }: { order: TOrder }) {
    const clientName = order.client
        ? [order.client.first_name, order.client.last_name].filter(Boolean).join(' ') ||
          `ID ${order.client.id}`
        : null;
    const executorName = order.executor
        ? [order.executor.first_name, order.executor.last_name].filter(Boolean).join(' ') ||
          `ID ${order.executor.id}`
        : null;

    return (
        <Link
            href={curatorOrderPath(order.id)}
            className="card bg-base-100 px-4 py-3 flex flex-row items-center gap-3 hover:bg-base-200 transition-colors active:scale-[0.99]"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Заказ #{order.id}</span>
                    <OrderStatus status={order.status} />
                </div>
                <p className="text-xs text-base-content/40 mt-0.5">
                    {formatDateRu(order.createdAt)}
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                    {clientName && (
                        <p className="text-xs text-base-content/60 truncate">
                            Клиент: {clientName}
                        </p>
                    )}
                    <p className="text-xs text-base-content/60 truncate">
                        {executorName ? `Мастер: ${executorName}` : 'Без мастера'}
                    </p>
                </div>
            </div>
            <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
        </Link>
    );
}

// ─── Шторка фильтров ──────────────────────────────────────────────────────────

type TFilterSheetProps = {
    isOpen: boolean;
    filters: TActiveFilters;
    onClose: () => void;
    onApply: (filters: TActiveFilters) => void;
};

function FilterSheet({ isOpen, filters, onClose, onApply }: TFilterSheetProps) {
    const [draft, setDraft] = useState<TActiveFilters>(filters);

    function toggleStatus(status: EOrderStatus) {
        setDraft((prev) => {
            const current = prev.statusOverride ?? [];
            const next = current.includes(status)
                ? current.filter((s) => s !== status)
                : [...current, status];
            return { ...prev, statusOverride: next.length > 0 ? next : null };
        });
    }

    function handleReset() {
        setDraft(DEFAULT_FILTERS);
    }

    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Фильтры">
            <div className="flex flex-col gap-5 pb-4">
                {/* Статус */}
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Статус</p>
                    <div className="flex flex-col gap-2">
                        {ALL_STATUSES.map((status) => {
                            const isChecked = draft.statusOverride?.includes(status) ?? false;
                            return (
                                <label
                                    key={status}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleStatus(status)}
                                        className="checkbox checkbox-sm checkbox-primary"
                                    />
                                    <OrderStatus status={status} />
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="divider my-0" />

                {/* Мастер */}
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Мастер</p>
                    <Suspense
                        fallback={
                            <select className="select select-bordered select-sm w-full" disabled>
                                <option>Загрузка...</option>
                            </select>
                        }
                    >
                        <MasterSelect
                            value={draft.executorId}
                            onChange={(id) => setDraft((prev) => ({ ...prev, executorId: id }))}
                        />
                    </Suspense>
                </div>

                <div className="divider my-0" />

                {/* Сортировка */}
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Сортировка</p>
                    <div className="flex flex-col gap-2">
                        {(
                            [
                                { value: 'desc', label: 'Сначала новые' },
                                { value: 'asc', label: 'Сначала старые' },
                            ] as const
                        ).map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-3 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="sortDir"
                                    checked={draft.sortDir === opt.value}
                                    onChange={() =>
                                        setDraft((prev) => ({ ...prev, sortDir: opt.value }))
                                    }
                                    className="radio radio-sm radio-primary"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-ghost btn-sm flex-1"
                    >
                        Сбросить
                    </button>
                    <button
                        type="button"
                        onClick={() => onApply(draft)}
                        className="btn btn-primary btn-sm flex-1"
                    >
                        Применить
                    </button>
                </div>
            </div>
        </BottomSheetModal>
    );
}

function MasterSelect({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (id: number | null) => void;
}) {
    const { data } = useGetCuratorMasters({ limit: 100 });
    const masters = data.pages.flatMap((p) => p.items);

    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="select select-bordered select-sm w-full"
        >
            <option value="">Все мастера</option>
            {masters.map((m) => (
                <option key={m.id} value={m.id}>
                    {[m.first_name, m.last_name].filter(Boolean).join(' ') || `ID ${m.id}`}
                </option>
            ))}
        </select>
    );
}
