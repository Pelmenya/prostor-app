'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore, selectSelectedItems, CART_QUERY_KEY } from '@/entities/cart';
import { useCart } from '@/entities/cart';
import { useAuth } from '@/shared/lib/platform';
import { useCreateOrder, EDeliveryType } from '@/entities/order';
import { useClientVisitPrices } from '@/entities/delivery';
import {
    useCheckoutStore,
    useFilteredExecutors,
    CheckoutAddressSelector,
    PickupStoreSelector,
    OrderScheduleDialog,
    CheckoutTotal,
    CheckoutProductsList,
    CheckoutServicesList,
    CheckoutSection,
} from '@/features/checkout';
import type { TUserWithWorkDays, TWorkDay } from '@/features/checkout';
import { PageContainer, PageTitle } from '@/shared/ui';
import { formatDateRu } from '@/shared/lib';
import { useQueryClient } from '@tanstack/react-query';

type TDeliveryTab = 'pickup' | 'master_delivery' | 'transport_company';

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const expBackoff = (attempt: number) => Math.min(400 * Math.pow(2, attempt), 3000);

export function CheckoutPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const items = useCartStore((s) => s.items);
    const selectedItems = selectSelectedItems(items);

    const { data: cartData } = useCart();

    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const selectedPickupStore = useCheckoutStore((s) => s.selectedPickupStore);
    const setSelectedPickupStore = useCheckoutStore((s) => s.setSelectedPickupStore);

    // Подсчёт что в корзине
    const hasProducts = Object.values(selectedItems).some(
        (item) => item.selectedForCheckout && item.count > 0,
    );
    const hasServices = Object.values(selectedItems).some((item) =>
        Object.values(item.services).some(
            (svc) => svc.checked && svc.count > 0 && svc.selectedForCheckout,
        ),
    );
    const hasContent = hasProducts || hasServices;

    // ID услуг и товаров для фильтрации мастеров
    const serviceIdsForFilter: string[] = [];
    const productItemsForFilter: { productId: string; count: number }[] = [];
    for (const [productId, item] of Object.entries(selectedItems)) {
        if (item.selectedForCheckout && item.count > 0) {
            productItemsForFilter.push({ productId, count: item.count });
        }
        for (const [serviceId, svc] of Object.entries(item.services)) {
            if (svc.checked && svc.count > 0 && svc.selectedForCheckout) {
                serviceIdsForFilter.push(serviceId);
            }
        }
    }

    // Мастера
    const { mutateAsync: fetchFilteredExecutors } = useFilteredExecutors();
    const [executorsWithWorkDays, setExecutorsWithWorkDays] = useState<TUserWithWorkDays[]>([]);
    const [executorsSearchStatus, setExecutorsSearchStatus] = useState<
        'idle' | 'loading' | 'success' | 'failed'
    >('idle');
    const [hasMasters, setHasMasters] = useState<boolean | null>(null);
    const [allMastersRejectedByCargo, setAllMastersRejectedByCargo] = useState(false);
    const [hasProductsWithoutDimensions, setHasProductsWithoutDimensions] = useState(false);

    const loadExecutors = async (realEstateId: number) => {
        setExecutorsSearchStatus('loading');
        const MAX_ATTEMPTS = 3;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                const result = await fetchFilteredExecutors({
                    realEstateId,
                    serviceIds: serviceIdsForFilter.length > 0 ? serviceIdsForFilter : undefined,
                    productItems:
                        productItemsForFilter.length > 0 ? productItemsForFilter : undefined,
                });
                setExecutorsWithWorkDays(result.executors);
                setHasMasters(result.executors.length > 0);
                setAllMastersRejectedByCargo(result.allMastersRejectedByCargo);
                setHasProductsWithoutDimensions(result.hasProductsWithoutDimensions);
                setExecutorsSearchStatus('success');
                return;
            } catch {
                if (attempt === MAX_ATTEMPTS - 1) {
                    setExecutorsSearchStatus('failed');
                    setHasMasters(false);
                } else {
                    await sleep(expBackoff(attempt));
                }
            }
        }
    };

    // Цены выезда
    const executorIds = executorsWithWorkDays.map((e) => Number(e.user.id));
    const { data: visitPrices } = useClientVisitPrices({
        realEstateId: selectedRealEstateId ?? 0,
        executorIds,
        enabled:
            !!selectedRealEstateId && executorIds.length > 0 && executorsSearchStatus === 'success',
    });

    // Доставка
    const [activeTab, setActiveTab] = useState<TDeliveryTab>('pickup');
    const [hasPickupStores, setHasPickupStores] = useState(true);

    // Мастер / дата
    const [selectedExecutor, setSelectedExecutor] = useState<TUserWithWorkDays | null>(null);
    const [desiredIntervalDate, setDesiredIntervalDate] = useState<[TWorkDay, TWorkDay] | null>(
        null,
    );
    const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

    // Поля формы
    const [clientComment, setClientComment] = useState('');
    const [receiptEmail, setReceiptEmail] = useState(user?.email ?? '');
    const [orderError, setOrderError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingLockRef = useRef(false);

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail);

    const deliveryType: EDeliveryType | undefined = hasProducts
        ? activeTab === 'pickup'
            ? EDeliveryType.PICKUP
            : activeTab === 'master_delivery'
              ? EDeliveryType.MASTER_DELIVERY
              : EDeliveryType.TRANSPORT_COMPANY
        : undefined;

    const isMasterDelivery = hasProducts && activeTab === 'master_delivery';
    const needServiceMasterSection = hasServices && !isMasterDelivery;

    const masterAvailable =
        hasMasters === true && !allMastersRejectedByCargo && !hasProductsWithoutDimensions;

    const clientVisitPriceData =
        visitPrices && selectedExecutor?.user?.id
            ? visitPrices.find((p) => Number(p.executorId) === Number(selectedExecutor.user.id))
            : undefined;

    const minVisitPrice =
        visitPrices && visitPrices.length > 0
            ? Math.min(...visitPrices.map((p) => p.totalPrice))
            : undefined;

    const visitPriceForTotal =
        isMasterDelivery || needServiceMasterSection ? clientVisitPriceData?.totalPrice : undefined;

    const hasSchedule = !hasServices
        ? true
        : isMasterDelivery
          ? !!selectedExecutor && (selectedExecutor.workDays?.length ?? 0) > 0
          : (!!selectedExecutor && (selectedExecutor.workDays?.length ?? 0) > 0) ||
            !!desiredIntervalDate;

    const canSubmit =
        !!user &&
        !!selectedRealEstateId &&
        hasContent &&
        isEmailValid &&
        !isSubmitting &&
        !(hasProducts && activeTab === 'pickup' && !selectedPickupStore) &&
        !(
            hasProducts &&
            activeTab === 'master_delivery' &&
            (!selectedExecutor || !selectedExecutor.workDays?.length)
        ) &&
        hasSchedule;

    const handleAddressChange = () => {
        setSelectedPickupStore(null);
        setSelectedExecutor(null);
        setDesiredIntervalDate(null);
        setHasMasters(null);
        setExecutorsWithWorkDays([]);
        setExecutorsSearchStatus('idle');
    };

    // При смене адреса — сбрасываем и загружаем мастеров
    useEffect(() => {
        handleAddressChange();
        if (selectedRealEstateId) {
            loadExecutors(selectedRealEstateId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRealEstateId]);

    const showMasterTab = hasServices && masterAvailable;
    const tabs: { key: TDeliveryTab; label: string; show: boolean }[] = [
        { key: 'pickup', label: 'Самовывоз', show: hasPickupStores },
        { key: 'master_delivery', label: 'Мастер', show: showMasterTab },
        { key: 'transport_company', label: 'ТК', show: !showMasterTab },
    ];

    const { mutateAsync: createOrder } = useCreateOrder();

    const handleSubmit = async () => {
        if (submittingLockRef.current || isSubmitting || !canSubmit) return;
        submittingLockRef.current = true;
        setIsSubmitting(true);
        setOrderError(null);

        const cartId = cartData?.id;
        if (!cartId) {
            setOrderError('Корзина не синхронизирована. Попробуйте ещё раз.');
            submittingLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        const MAX_ATTEMPTS = 3;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                const order = await createOrder({
                    clientId: user!.id,
                    realEstateId: selectedRealEstateId!,
                    cartId,
                    deliveryType,
                    pickupStoreId:
                        hasProducts && activeTab === 'pickup' ? selectedPickupStore?.id : undefined,
                    organizationId:
                        hasProducts && activeTab === 'pickup'
                            ? selectedPickupStore?.organizationMoySkladId
                            : undefined,
                    executorId: selectedExecutor?.user?.id,
                    scheduledDate: selectedExecutor?.workDays?.[0],
                    desiredIntervalDate: desiredIntervalDate ?? undefined,
                    clientComment: clientComment || undefined,
                    email: receiptEmail || undefined,
                });

                await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
                router.replace(`/orders/${order.id}`);
                return;
            } catch (err) {
                if (attempt === MAX_ATTEMPTS - 1) {
                    console.error('[checkout] handleSubmit error:', err);
                    setOrderError(
                        'Ошибка при оформлении. Проверьте соединение и попробуйте ещё раз.',
                    );
                } else {
                    await sleep(expBackoff(attempt));
                }
            }
        }

        submittingLockRef.current = false;
        setIsSubmitting(false);
    };

    return (
        <>
            <PageContainer className={isSubmitting ? 'pointer-events-none opacity-50' : ''}>
                <div className="flex flex-col gap-4 pb-4">
                    <PageTitle>Оформление</PageTitle>

                    <CheckoutAddressSelector onChange={handleAddressChange} />

                    {selectedRealEstateId && hasContent && (
                        <>
                            {/* Доставка (только если есть товары) */}
                            {hasProducts && (
                                <CheckoutSection title="Доставка">
                                    <div role="tablist" className="tabs tabs-border">
                                        {tabs
                                            .filter((t) => t.show)
                                            .map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    role="tab"
                                                    type="button"
                                                    className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                                                    onClick={() => {
                                                        setActiveTab(tab.key);
                                                        if (tab.key !== 'pickup')
                                                            setSelectedPickupStore(null);
                                                        if (
                                                            tab.key !== 'master_delivery' &&
                                                            isMasterDelivery
                                                        ) {
                                                            setSelectedExecutor(null);
                                                        }
                                                    }}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                    </div>

                                    {activeTab === 'pickup' && (
                                        <PickupStoreSelector
                                            realEstateId={selectedRealEstateId}
                                            selectedStoreId={selectedPickupStore?.id}
                                            onSelect={setSelectedPickupStore}
                                            onHasStoresChange={setHasPickupStores}
                                        />
                                    )}

                                    {activeTab === 'master_delivery' && (
                                        <div className="flex flex-col gap-3">
                                            <div className="rounded-xl bg-base-100 p-4 text-sm">
                                                <p className="font-medium">
                                                    Доставка мастером — бесплатно
                                                </p>
                                                <p className="text-xs opacity-60 mt-1">
                                                    Мастер привезёт товары при выезде.
                                                </p>
                                            </div>

                                            <VisitPriceBlock
                                                isLoading={executorsSearchStatus === 'loading'}
                                                clientVisitPrice={clientVisitPriceData}
                                                minVisitPrice={minVisitPrice}
                                            />

                                            {selectedExecutor && (
                                                <ExecutorPreview executor={selectedExecutor} />
                                            )}

                                            <button
                                                onClick={() => setScheduleDialogOpen(true)}
                                                className="btn btn-primary btn-outline w-full"
                                                disabled={executorsSearchStatus === 'loading'}
                                            >
                                                {executorsSearchStatus === 'loading' ? (
                                                    <>
                                                        <span className="loading loading-spinner loading-xs" />
                                                        Поиск мастеров...
                                                    </>
                                                ) : selectedExecutor ? (
                                                    'Изменить мастера или дату'
                                                ) : (
                                                    'Выбрать мастера и дату'
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === 'transport_company' && (
                                        <div className="rounded-xl bg-base-100 p-4 text-sm">
                                            <p className="font-medium">
                                                Доставка транспортной компанией
                                            </p>
                                            <p className="text-xs opacity-60 mt-1">
                                                Стоимость рассчитает менеджер после оформления.
                                            </p>
                                        </div>
                                    )}
                                </CheckoutSection>
                            )}

                            {/* Список товаров */}
                            {hasProducts && (
                                <CheckoutSection title="Товары">
                                    <CheckoutProductsList items={selectedItems} />
                                </CheckoutSection>
                            )}

                            {/* Список услуг */}
                            {hasServices && (
                                <CheckoutSection title="Услуги">
                                    <CheckoutServicesList items={selectedItems} />
                                </CheckoutSection>
                            )}

                            {/* Секция мастера (для услуг без master_delivery) */}
                            {needServiceMasterSection && (
                                <CheckoutSection title="Исполнитель">
                                    <VisitPriceBlock
                                        isLoading={executorsSearchStatus === 'loading'}
                                        clientVisitPrice={clientVisitPriceData}
                                        minVisitPrice={minVisitPrice}
                                    />

                                    {selectedExecutor && (
                                        <ExecutorPreview executor={selectedExecutor} />
                                    )}

                                    {desiredIntervalDate && (
                                        <div>
                                            <p className="text-sm">Желаемый интервал:</p>
                                            <p className="badge badge-warning mt-1">
                                                {formatDateRu(desiredIntervalDate[0].date ?? '')} —{' '}
                                                {formatDateRu(desiredIntervalDate[1].date ?? '')}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setScheduleDialogOpen(true)}
                                        className="btn btn-primary btn-outline w-full"
                                    >
                                        {hasMasters === true
                                            ? desiredIntervalDate || selectedExecutor
                                                ? 'Изменить исполнителя и (или) дату'
                                                : 'Выбрать исполнителя и дату'
                                            : desiredIntervalDate
                                              ? 'Изменить интервал дат'
                                              : 'Выбрать желаемый интервал дат'}
                                    </button>
                                </CheckoutSection>
                            )}

                            {/* Email для чека */}
                            <div className="flex flex-col gap-1">
                                <input
                                    type="email"
                                    value={receiptEmail}
                                    onChange={(e) => setReceiptEmail(e.target.value)}
                                    placeholder="Email для чека"
                                    className={`input input-bordered input-md w-full ${receiptEmail && !isEmailValid ? 'input-error' : ''}`}
                                />
                                {receiptEmail && !isEmailValid && (
                                    <span className="text-xs text-error">
                                        Введите корректный email
                                    </span>
                                )}
                            </div>

                            {orderError && <p className="text-error text-sm">{orderError}</p>}

                            {/* Комментарий */}
                            <input
                                type="text"
                                value={clientComment}
                                onChange={(e) => setClientComment(e.target.value)}
                                placeholder="Комментарий к заказу (необязательно)"
                                className="input input-bordered input-md w-full"
                            />
                        </>
                    )}

                    {selectedRealEstateId && !hasContent && (
                        <div className="text-center py-8 opacity-60">
                            В корзине нет выбранных позиций
                        </div>
                    )}
                </div>
            </PageContainer>

            {selectedRealEstateId && hasContent && (
                <CheckoutTotal
                    clientVisitPrice={visitPriceForTotal}
                    onAction={handleSubmit}
                    disabled={!canSubmit}
                    isLoading={isSubmitting}
                />
            )}

            <OrderScheduleDialog
                isOpen={isScheduleDialogOpen}
                onClose={() => setScheduleDialogOpen(false)}
                onSelect={
                    isMasterDelivery
                        ? (executor) => {
                              if (executor.user) {
                                  setSelectedExecutor(executor as TUserWithWorkDays);
                              }
                              setScheduleDialogOpen(false);
                          }
                        : (executor) => {
                              if (executor.user) {
                                  setSelectedExecutor(executor as TUserWithWorkDays);
                                  setDesiredIntervalDate(null);
                              } else if (executor.workDays.length === 2) {
                                  setSelectedExecutor(null);
                                  setDesiredIntervalDate([
                                      executor.workDays[0],
                                      executor.workDays[1],
                                  ]);
                              } else {
                                  setSelectedExecutor(null);
                                  setDesiredIntervalDate(null);
                              }
                              setScheduleDialogOpen(false);
                          }
                }
                executorsWithWorkDays={executorsWithWorkDays}
                selectedExecutor={selectedExecutor ?? undefined}
                searchStatus={executorsSearchStatus}
                visitPrices={visitPrices}
            />
        </>
    );
}

// --- Вспомогательные компоненты ---

type TVisitPriceBlockProps = {
    isLoading: boolean;
    clientVisitPrice?: { totalPrice: number; distanceKm: number; departureName: string };
    minVisitPrice?: number;
};

function VisitPriceBlock({ isLoading, clientVisitPrice, minVisitPrice }: TVisitPriceBlockProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="loading loading-spinner loading-xs" />
                Рассчитываем стоимость выезда...
            </div>
        );
    }
    if (clientVisitPrice) {
        return (
            <div className="rounded-xl bg-base-100 p-3 text-sm">
                <div className="flex justify-between">
                    <span>Выезд к клиенту ({clientVisitPrice.distanceKm} км)</span>
                    <span className="font-semibold text-primary">
                        {(clientVisitPrice.totalPrice / 100).toLocaleString('ru-RU')} ₽
                    </span>
                </div>
                <p className="text-xs opacity-60 mt-1">от: {clientVisitPrice.departureName}</p>
            </div>
        );
    }
    if (minVisitPrice !== undefined) {
        return (
            <div className="rounded-xl bg-base-100 p-3 text-sm">
                <div className="flex justify-between">
                    <span>Выезд к клиенту</span>
                    <span className="font-semibold text-primary">
                        от {(minVisitPrice / 100).toLocaleString('ru-RU')} ₽
                    </span>
                </div>
                <p className="text-xs opacity-60 mt-1">Точная стоимость зависит от мастера</p>
            </div>
        );
    }
    return null;
}

type TExecutorPreviewProps = {
    executor: TUserWithWorkDays;
};

function ExecutorPreview({ executor }: TExecutorPreviewProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {executor.user.photo_url && (
                    <Image
                        src={executor.user.photo_url}
                        alt={executor.user.last_name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                    />
                )}
                <div>
                    <p className="font-medium text-sm">
                        {executor.user.first_name} {executor.user.last_name}
                    </p>
                </div>
            </div>
            {executor.workDays?.[0]?.date && (
                <p className="badge badge-warning">
                    Дата: {formatDateRu(executor.workDays[0].date)}
                </p>
            )}
        </div>
    );
}
