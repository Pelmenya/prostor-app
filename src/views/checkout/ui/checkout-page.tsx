'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore, selectSelectedItems } from '@/entities/cart';
import { useAuth } from '@/shared/lib/platform';
import { EDeliveryType } from '@/entities/order';
import { useClientVisitPrices } from '@/entities/delivery';
import {
    useCheckoutStore,
    useCheckoutExecutors,
    useCheckoutSubmit,
    isEmailValid,
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

type TDeliveryTab = 'pickup' | 'master_delivery' | 'transport_company';

export function CheckoutPage() {
    const { user } = useAuth();
    const items = useCartStore((s) => s.items);
    const selectedItems = selectSelectedItems(items);

    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const selectedPickupStore = useCheckoutStore((s) => s.selectedPickupStore);
    const setSelectedPickupStore = useCheckoutStore((s) => s.setSelectedPickupStore);

    const hasProducts = Object.values(selectedItems).some(
        (item) => item.selectedForCheckout && item.count > 0,
    );
    const hasServices = Object.values(selectedItems).some((item) =>
        Object.values(item.services).some(
            (svc) => svc.checked && svc.count > 0 && svc.selectedForCheckout,
        ),
    );
    const hasContent = hasProducts || hasServices;

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

    const {
        executorsWithWorkDays,
        executorsSearchStatus,
        hasMasters,
        allMastersRejectedByCargo,
        hasProductsWithoutDimensions,
        loadExecutors,
        resetExecutors,
    } = useCheckoutExecutors({
        serviceIds: serviceIdsForFilter,
        productItems: productItemsForFilter,
    });

    const executorIds = executorsWithWorkDays.map((e) => Number(e.user.id));
    const { data: visitPrices } = useClientVisitPrices({
        realEstateId: selectedRealEstateId ?? 0,
        executorIds,
        enabled:
            !!selectedRealEstateId && executorIds.length > 0 && executorsSearchStatus === 'success',
    });

    const [activeTab, setActiveTab] = useState<TDeliveryTab>('pickup');
    const [hasPickupStores, setHasPickupStores] = useState(true);

    useEffect(() => {
        if (!hasPickupStores && activeTab === 'pickup') {
            setActiveTab('transport_company');
        }
    }, [hasPickupStores, activeTab]);
    const [selectedExecutor, setSelectedExecutor] = useState<TUserWithWorkDays | null>(null);
    const [desiredIntervalDate, setDesiredIntervalDate] = useState<[TWorkDay, TWorkDay] | null>(
        null,
    );
    const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [clientComment, setClientComment] = useState('');
    const [receiptEmail, setReceiptEmail] = useState(user?.email ?? '');

    const isMasterDelivery = hasProducts && activeTab === 'master_delivery';
    const needServiceMasterSection = hasServices && !isMasterDelivery;
    const masterAvailable =
        hasMasters === true && !allMastersRejectedByCargo && !hasProductsWithoutDimensions;

    const deliveryType: EDeliveryType | undefined = hasProducts
        ? activeTab === 'pickup'
            ? EDeliveryType.PICKUP
            : activeTab === 'master_delivery'
              ? EDeliveryType.MASTER_DELIVERY
              : EDeliveryType.TRANSPORT_COMPANY
        : undefined;

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

    const emailValid = isEmailValid(receiptEmail);

    const canSubmit =
        !!user &&
        !!selectedRealEstateId &&
        hasContent &&
        emailValid &&
        !(hasProducts && activeTab === 'pickup' && !selectedPickupStore) &&
        !(
            hasProducts &&
            activeTab === 'master_delivery' &&
            (!selectedExecutor || !selectedExecutor.workDays?.length)
        ) &&
        hasSchedule;

    const { isSubmitting, orderError, handleSubmit } = useCheckoutSubmit({
        deliveryType,
        hasProducts,
        activeTab,
        selectedExecutor,
        desiredIntervalDate,
        clientComment,
        receiptEmail,
    });

    const handleAddressChange = () => {
        setSelectedPickupStore(null);
        setSelectedExecutor(null);
        setDesiredIntervalDate(null);
        resetExecutors();
    };

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

    const checkoutFooter =
        selectedRealEstateId && hasContent ? (
            <CheckoutTotal
                clientVisitPrice={visitPriceForTotal}
                onAction={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                isLoading={isSubmitting}
            />
        ) : undefined;

    return (
        <>
            <PageContainer
                className={isSubmitting ? 'pointer-events-none opacity-50' : ''}
                footer={checkoutFooter}
            >
                <div className="flex flex-col gap-4 pb-4">
                    <PageTitle>Оформление</PageTitle>

                    <CheckoutAddressSelector onChange={handleAddressChange} />

                    {selectedRealEstateId && hasContent && (
                        <>
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
                                                    Мастер привезёт товары при выезде
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
                                                Стоимость рассчитает менеджер после оформления
                                            </p>
                                        </div>
                                    )}
                                </CheckoutSection>
                            )}

                            {hasProducts && (
                                <CheckoutSection title="Товары">
                                    <CheckoutProductsList items={selectedItems} />
                                </CheckoutSection>
                            )}

                            {hasServices && (
                                <CheckoutSection title="Услуги">
                                    <CheckoutServicesList items={selectedItems} />
                                </CheckoutSection>
                            )}

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

                            <div className="flex flex-col gap-1">
                                <input
                                    type="email"
                                    value={receiptEmail}
                                    onChange={(e) => setReceiptEmail(e.target.value)}
                                    placeholder="Email для чека"
                                    className={`input input-bordered input-md w-full ${receiptEmail && !emailValid ? 'input-error' : ''}`}
                                />
                                {receiptEmail && !emailValid && (
                                    <span className="text-xs text-error">
                                        Введите корректный email
                                    </span>
                                )}
                            </div>

                            {orderError && <p className="text-error text-sm">{orderError}</p>}

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
