'use client';

import { useState } from 'react';
import { useCartStore } from '@/entities/cart';
import { useAuth } from '@/shared/lib/platform';
import { useClientVisitPrices } from '@/entities/delivery';
import {
    useCheckoutStore,
    useCheckoutExecutors,
    useCheckoutSubmit,
    getCheckoutCartItems,
    getCheckoutDerivedState,
    CheckoutAddressSelector,
    PickupStoreSelector,
    OrderScheduleDialog,
    CheckoutTotal,
    CheckoutSection,
    VisitPriceBlock,
    ExecutorPreview,
} from '@/features/checkout';
import type { TUserWithWorkDays, TDeliveryTab } from '@/features/checkout';
import type { TWorkDay } from '@/entities/order';
import { CartReadonlyView } from '@/features/cart';
import { useProductThumbnails } from '@/entities/product';
import { PageContainer, PageTitle } from '@/shared/ui';
import { formatDateRu } from '@/shared/lib';

export function CheckoutPage() {
    const { user } = useAuth();
    const items = useCartStore((s) => s.items);

    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const selectedPickupStore = useCheckoutStore((s) => s.selectedPickupStore);
    const setSelectedPickupStore = useCheckoutStore((s) => s.setSelectedPickupStore);

    const [activeTab, setActiveTab] = useState<TDeliveryTab>('pickup');
    const [hasPickupStores, setHasPickupStores] = useState(true);
    const [selectedExecutor, setSelectedExecutor] = useState<TUserWithWorkDays | null>(null);
    const [desiredIntervalDate, setDesiredIntervalDate] = useState<[TWorkDay, TWorkDay] | null>(
        null,
    );
    const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [clientComment, setClientComment] = useState('');
    const [receiptEmail, setReceiptEmail] = useState(user?.email ?? '');

    const handleHasPickupStoresChange = (hasStores: boolean) => {
        setHasPickupStores(hasStores);
        if (!hasStores && activeTab === 'pickup') {
            setActiveTab('transport_company');
        }
    };

    // Шаг 1: данные из корзины — нужны до вызова useCheckoutExecutors
    const { serviceIdsForFilter, productItemsForFilter, ...cartItems } =
        getCheckoutCartItems(items);

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

    // Шаг 2: все производные значения
    const {
        selectedItems,
        hasProducts,
        hasServices,
        hasContent,
        isMasterDelivery,
        needServiceMasterSection,
        masterAvailable,
        deliveryType,
        clientVisitPriceData,
        minVisitPrice,
        visitPriceForTotal,
        emailValid,
        canSubmit,
        isExecutorsLoading,
    } = getCheckoutDerivedState({
        ...cartItems,
        serviceIdsForFilter,
        productItemsForFilter,
        activeTab,
        selectedExecutor,
        desiredIntervalDate,
        selectedPickupStore,
        executorsSearchStatus,
        hasMasters,
        allMastersRejectedByCargo,
        hasProductsWithoutDimensions,
        visitPrices,
        receiptEmail,
        userId: user?.id,
        selectedRealEstateId,
    });

    const { isSubmitting, orderError, handleSubmit } = useCheckoutSubmit({
        deliveryType,
        hasProducts,
        activeTab,
        selectedExecutor,
        desiredIntervalDate,
        clientComment,
        receiptEmail,
    });

    const handleAddressChange = (newId: number) => {
        setSelectedPickupStore(null);
        setSelectedExecutor(null);
        setDesiredIntervalDate(null);
        resetExecutors();
        loadExecutors(newId);
    };

    const productIds = Object.keys(selectedItems);
    const { imageUrls, loadingIds } = useProductThumbnails(productIds);

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
                                            onHasStoresChange={handleHasPickupStoresChange}
                                            cartItems={productItemsForFilter}
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
                                                isLoading={isExecutorsLoading}
                                                clientVisitPrice={clientVisitPriceData}
                                                minVisitPrice={minVisitPrice}
                                            />

                                            {selectedExecutor && (
                                                <ExecutorPreview executor={selectedExecutor} />
                                            )}

                                            <button
                                                onClick={() => setScheduleDialogOpen(true)}
                                                className="btn btn-primary btn-outline w-full"
                                                disabled={isExecutorsLoading}
                                            >
                                                {isExecutorsLoading ? (
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

                            {(hasProducts || hasServices) && (
                                <CheckoutSection title="Состав заказа">
                                    <CartReadonlyView
                                        items={selectedItems}
                                        imageUrls={imageUrls}
                                        loadingIds={loadingIds}
                                    />
                                </CheckoutSection>
                            )}

                            {needServiceMasterSection && (
                                <CheckoutSection title="Исполнитель">
                                    <VisitPriceBlock
                                        isLoading={isExecutorsLoading}
                                        clientVisitPrice={clientVisitPriceData}
                                        minVisitPrice={minVisitPrice}
                                    />

                                    {selectedExecutor && (
                                        <ExecutorPreview executor={selectedExecutor} />
                                    )}

                                    {desiredIntervalDate &&
                                        desiredIntervalDate[0].date &&
                                        desiredIntervalDate[1].date && (
                                            <div>
                                                <p className="text-sm">Желаемый интервал:</p>
                                                <p className="badge badge-warning mt-1">
                                                    {formatDateRu(desiredIntervalDate[0].date)} —{' '}
                                                    {formatDateRu(desiredIntervalDate[1].date)}
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
                                  setSelectedExecutor({
                                      user: executor.user,
                                      workDays: executor.workDays,
                                  });
                              }
                              setScheduleDialogOpen(false);
                          }
                        : (executor) => {
                              if (executor.user) {
                                  setSelectedExecutor({
                                      user: executor.user,
                                      workDays: executor.workDays,
                                  });
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
                desiredIntervalDate={desiredIntervalDate}
                searchStatus={executorsSearchStatus}
                visitPrices={visitPrices}
            />
        </>
    );
}
