'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useCartStore, useCartHydrated, selectTotalItems } from '@/entities/cart';
import { useInventoryCheck } from '@/entities/real-estate';
import { BottomSheetModal } from '@/shared/ui';
import {
    MapPinIcon,
    ShoppingBagIcon,
    CubeIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useWaterMapStore } from '../model';

type TStoreDetailsSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Координаты точки `[lat, lon]` (как на pin'е, не GeoJSON-order). */
    coords: [number, number] | null;
    /** МойСклад storeId точки продаж (поле `id` из stores response). */
    storeMoySkladId: string | null;
    /** Имя точки для header'а. */
    storeName: string | null;
    /** Адрес. */
    storeAddress: string | null;
    /** Время в пути от pin'а в секундах (OSRM). */
    durationSeconds: number | null;
    /** Расстояние в метрах. */
    distanceMeters: number | null;
};

type TTab = 'inventory' | 'route' | 'cart';

/**
 * V2 progressive disclosure для StorePopup — открывается по кнопке «Детали»
 * mini-card'а. 3 таба:
 *   - **Магазин** — inventory check всех cart items, breakdown «N из M в наличии»
 *     (виден только если cart не пустой)
 *   - **Маршрут** — duration + distance + CTA «Построить на карте» (всегда виден)
 *   - **Корзина** — shortcut на /cart с counter (виден если cart не пустой)
 *
 * Если cart пустой → доступен только tab «Маршрут», auto-выбран. Это базовый
 * UX для гостя без покупок — продолжает работать как одностраничный sheet.
 */
export function StoreDetailsSheet({
    isOpen,
    onClose,
    coords,
    storeMoySkladId,
    storeName,
    storeAddress,
    durationSeconds,
    distanceMeters,
}: TStoreDetailsSheetProps) {
    const hydrated = useCartHydrated();
    const cartItems = useCartStore((s) => s.items);
    const setSelectedRouteTo = useWaterMapStore((s) => s.setSelectedRouteTo);
    const selectedRouteTo = useWaterMapStore((s) => s.selectedRouteTo);

    // Маппим cart → bones для inventory-check API. Скипаем zero-count items
    // (там только services). Хешем `Object.values` чтобы query key стабильный.
    const checkItems = useMemo(() => {
        if (!hydrated) return [];
        return Object.values(cartItems)
            .filter((it) => it.count > 0)
            .map((it) => ({
                productId: it.product.id,
                count: it.count,
                productName: it.product.name,
            }));
    }, [cartItems, hydrated]);

    const totalCartItems = hydrated ? selectTotalItems(cartItems) : 0;
    const hasCart = checkItems.length > 0;

    // `null` = «юзер ещё не свитчил вручную» → default зависит от наличия
    // cart (если есть → «Магазин» как value-add, иначе → «Маршрут»). После
    // явного тапа на tab — respect выбор юзера.
    const [tab, setTab] = useState<TTab | null>(null);

    const effectiveTab: TTab =
        tab && (tab !== 'inventory' || hasCart) && (tab !== 'cart' || hasCart)
            ? tab
            : hasCart
              ? 'inventory'
              : 'route';

    const inventoryQuery = useInventoryCheck(
        isOpen && hasCart && storeMoySkladId ? { storeMoySkladId, items: checkItems } : null,
    );

    if (!coords) return null;

    const [lat, lon] = coords;
    const isActiveRoute =
        selectedRouteTo !== null &&
        Math.abs(selectedRouteTo[0] - lon) < 1e-6 &&
        Math.abs(selectedRouteTo[1] - lat) < 1e-6;

    const handleShowRoute = () => {
        if (isActiveRoute) {
            setSelectedRouteTo(null);
        } else {
            setSelectedRouteTo([lon, lat]);
        }
        onClose();
    };

    return (
        <BottomSheetModal isOpen={isOpen} onClose={onClose} title={storeName ?? 'Точка продаж'}>
            <div className="px-1 -mt-1 pb-1">
                {storeAddress && (
                    <p className="text-xs text-base-content/65 leading-snug mb-3 px-3">
                        {storeAddress}
                    </p>
                )}

                {/* Tab strip. Скрываем inventory + cart когда cart пустой. */}
                <div className="border-b border-base-content/10 px-3 flex gap-1 -mb-px">
                    {hasCart && (
                        <TabButton
                            active={effectiveTab === 'inventory'}
                            onClick={() => setTab('inventory')}
                            icon={<CubeIcon className="size-4" />}
                            label="Магазин"
                            badge={
                                inventoryQuery.data
                                    ? `${inventoryQuery.data.summary.availableCount}/${inventoryQuery.data.summary.totalCount}`
                                    : undefined
                            }
                            badgeVariant={
                                inventoryQuery.data?.summary.allAvailable ? 'success' : 'warning'
                            }
                        />
                    )}
                    <TabButton
                        active={effectiveTab === 'route'}
                        onClick={() => setTab('route')}
                        icon={<MapPinIcon className="size-4" />}
                        label="Маршрут"
                        badge={formatDurationShort(durationSeconds)}
                    />
                    {hasCart && (
                        <TabButton
                            active={effectiveTab === 'cart'}
                            onClick={() => setTab('cart')}
                            icon={<ShoppingBagIcon className="size-4" />}
                            label="Корзина"
                            badge={String(totalCartItems)}
                        />
                    )}
                </div>

                <div className="px-3 pt-3">
                    {effectiveTab === 'inventory' && (
                        <InventoryTab
                            isLoading={inventoryQuery.isPending}
                            isError={inventoryQuery.isError}
                            data={inventoryQuery.data}
                        />
                    )}

                    {effectiveTab === 'route' && (
                        <RouteTab
                            durationSeconds={durationSeconds}
                            distanceMeters={distanceMeters}
                            isActiveRoute={isActiveRoute}
                            onToggleRoute={handleShowRoute}
                        />
                    )}

                    {effectiveTab === 'cart' && (
                        <CartTab totalItems={totalCartItems} onCloseSheet={onClose} />
                    )}
                </div>
            </div>
        </BottomSheetModal>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    label,
    badge,
    badgeVariant,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: string;
    badgeVariant?: 'success' | 'warning';
}) {
    const badgeCls =
        badgeVariant === 'success'
            ? 'bg-success/15 text-success'
            : badgeVariant === 'warning'
              ? 'bg-warning/15 text-warning'
              : 'bg-base-300 text-base-content/70';
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={`relative -mb-px flex items-center gap-1 px-2 py-2 text-xs font-medium border-b-2 transition-colors flex-1 sm:flex-initial justify-center ${
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/70 hover:text-base-content'
            }`}
        >
            {icon}
            <span className="hidden sm:inline whitespace-nowrap">{label}</span>
            {badge !== undefined && (
                <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none ${badgeCls}`}
                >
                    {badge}
                </span>
            )}
        </button>
    );
}

function InventoryTab({
    isLoading,
    isError,
    data,
}: {
    isLoading: boolean;
    isError: boolean;
    data?: import('@/shared/model').TInventoryCheckResponse;
}) {
    if (isLoading) {
        return (
            <ul className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="h-9 rounded-md bg-base-200/60 animate-pulse" />
                ))}
            </ul>
        );
    }
    if (isError || !data) {
        return (
            <p className="text-xs text-error/80 py-3">
                Не удалось проверить наличие. Попробуйте позже.
            </p>
        );
    }

    const { available, outOfStock, summary } = data;
    return (
        <div className="space-y-3 pb-2">
            <div
                className={`rounded-lg p-2 text-sm flex items-center justify-between ${
                    summary.allAvailable
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                }`}
            >
                <span className="font-medium">
                    {summary.allAvailable
                        ? 'Все позиции корзины в наличии'
                        : `${summary.availableCount} из ${summary.totalCount} в наличии`}
                </span>
                <span className="text-xs opacity-70 tabular-nums">
                    {summary.availableCount}/{summary.totalCount}
                </span>
            </div>

            {outOfStock.length > 0 && (
                <section>
                    <h5 className="text-[11px] uppercase tracking-wider font-medium text-base-content/55 mb-1">
                        Не хватает · {outOfStock.length}
                    </h5>
                    <ul className="space-y-1">
                        {outOfStock.map((it) => {
                            // Различаем «совсем нет» (availableCount = 0, red)
                            // и «частично есть» (0 < availableCount < requiredCount, orange).
                            // UX: реальный сток часто бывает 1/8 — это не «нет»,
                            // юзер должен понимать что можно купить хотя бы часть.
                            const partial = it.availableCount > 0;
                            return (
                                <li
                                    key={it.productId}
                                    className="flex items-start gap-2 text-xs leading-snug"
                                >
                                    {partial ? (
                                        <span className="inline-flex items-center justify-center size-4 rounded-full bg-warning/20 text-warning shrink-0 mt-0.5 text-[10px] font-bold">
                                            !
                                        </span>
                                    ) : (
                                        <XMarkIcon className="size-4 text-error shrink-0 mt-0.5" />
                                    )}
                                    <span className="flex-1 min-w-0">
                                        <span className="text-base-content">
                                            {it.productName ?? it.productId}
                                        </span>
                                        <span
                                            className={`ml-1 tabular-nums ${
                                                partial ? 'text-warning' : 'text-base-content/55'
                                            }`}
                                        >
                                            {partial
                                                ? `${it.availableCount} из ${it.requiredCount}`
                                                : `нужно ${it.requiredCount}, есть 0`}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {available.length > 0 && (
                <section>
                    <h5 className="text-[11px] uppercase tracking-wider font-medium text-base-content/55 mb-1">
                        В наличии · {available.length}
                    </h5>
                    <ul className="space-y-1">
                        {available.map((it) => (
                            <li
                                key={it.productId}
                                className="flex items-start gap-2 text-xs leading-snug"
                            >
                                <CheckIcon className="size-4 text-success shrink-0 mt-0.5" />
                                <span className="flex-1 min-w-0">
                                    <span className="text-base-content/80">
                                        {it.productName ?? it.productId}
                                    </span>
                                    <span className="ml-1 text-base-content/55 tabular-nums">
                                        × {it.requiredCount}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}

function RouteTab({
    durationSeconds,
    distanceMeters,
    isActiveRoute,
    onToggleRoute,
}: {
    durationSeconds: number | null;
    distanceMeters: number | null;
    isActiveRoute: boolean;
    onToggleRoute: () => void;
}) {
    const durationLabel = formatDuration(durationSeconds);
    const distanceLabel = formatDistance(distanceMeters);
    return (
        <div className="space-y-3 pb-2">
            <dl className="grid grid-cols-2 gap-2">
                <Stat label="Время в пути" value={durationLabel ?? '—'} />
                <Stat label="Расстояние" value={distanceLabel ?? '—'} />
            </dl>
            <button
                type="button"
                onClick={onToggleRoute}
                className={`btn btn-block ${isActiveRoute ? 'btn-outline btn-primary' : 'btn-primary'}`}
            >
                <MapPinIcon className="size-5" />
                {isActiveRoute ? 'Скрыть маршрут на карте' : 'Показать маршрут на карте'}
            </button>
        </div>
    );
}

function CartTab({ totalItems, onCloseSheet }: { totalItems: number; onCloseSheet: () => void }) {
    return (
        <div className="space-y-3 pb-2">
            <p className="text-sm text-base-content/80">
                В корзине {totalItems} {countTail(totalItems, 'позиция', 'позиции', 'позиций')}.
                Можно проверить состав и оформить заказ.
            </p>
            <Link
                href="/cart"
                onClick={onCloseSheet}
                className="btn btn-block btn-primary normal-case"
            >
                <ShoppingBagIcon className="size-5" />
                Открыть корзину
            </Link>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-base-200/60 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-base-content/55">{label}</dt>
            <dd className="text-sm font-medium text-base-content tabular-nums">{value}</dd>
        </div>
    );
}

function formatDuration(seconds: number | null): string | null {
    if (seconds === null || !Number.isFinite(seconds)) return null;
    const min = seconds / 60;
    if (min < 1) return '< 1 мин';
    if (min < 60) return `${Math.round(min)} мин`;
    const h = Math.floor(min / 60);
    const rest = Math.round(min % 60);
    return rest === 0 ? `${h} ч` : `${h} ч ${rest} мин`;
}

function formatDurationShort(seconds: number | null): string | undefined {
    if (seconds === null || !Number.isFinite(seconds)) return undefined;
    const min = Math.round(seconds / 60);
    if (min < 1) return '<1м';
    if (min < 60) return `${min}м`;
    const h = Math.floor(min / 60);
    return `${h}ч`;
}

function formatDistance(meters: number | null): string | null {
    if (meters === null || !Number.isFinite(meters)) return null;
    if (meters < 1000) return `${Math.round(meters)} м`;
    return `${(meters / 1000).toFixed(1)} км`;
}

function countTail(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}
