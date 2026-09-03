import { selectSelectedItems } from '@/entities/cart';
import type { TCartItem } from '@/entities/cart';
import { EDeliveryType } from '@/entities/order';
import type { TWorkDay } from '@/shared/model';
import type { TClientVisitPriceItem } from '@/entities/delivery';
import type { TRetailStoreWithRouteInfo } from '@/shared/model';
import { isEmailValid } from './use-checkout-submit';
import type { TExecutorsSearchStatus } from './use-checkout-executors';
import type { TUserWithWorkDays } from '../model/types/t-user-with-work-days';

export type TDeliveryTab = 'pickup' | 'master_delivery' | 'transport_company';

/** Шаг 1: данные из корзины — нужны до вызова useCheckoutExecutors */
export function getCheckoutCartItems(items: Record<string, TCartItem>) {
    const selectedItems = selectSelectedItems(items);

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

    return {
        selectedItems,
        hasProducts,
        hasServices,
        hasContent,
        serviceIdsForFilter,
        productItemsForFilter,
    };
}

type TCheckoutDerivedStateParams = {
    // Cart (из getCheckoutCartItems)
    selectedItems: Record<string, TCartItem>;
    hasProducts: boolean;
    hasServices: boolean;
    hasContent: boolean;
    productItemsForFilter: { productId: string; count: number }[];
    serviceIdsForFilter: string[];
    // Выбор пользователя
    activeTab: TDeliveryTab;
    selectedExecutor: TUserWithWorkDays | null;
    desiredIntervalDate: [TWorkDay, TWorkDay] | null;
    selectedPickupStore: TRetailStoreWithRouteInfo | null;
    // Поиск исполнителей
    executorsSearchStatus: TExecutorsSearchStatus;
    hasMasters: boolean | null;
    allMastersRejectedByCargo: boolean;
    hasProductsWithoutDimensions: boolean;
    // Цены
    visitPrices: TClientVisitPriceItem[] | undefined;
    // Форма
    receiptEmail: string;
    userId: number | undefined;
    selectedRealEstateId: number | null;
};

/** Шаг 2: все производные значения — вычисляются после получения данных от useCheckoutExecutors */
export function getCheckoutDerivedState({
    selectedItems,
    hasProducts,
    hasServices,
    hasContent,
    productItemsForFilter,
    serviceIdsForFilter,
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
    userId,
    selectedRealEstateId,
}: TCheckoutDerivedStateParams) {
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
        !!userId &&
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

    const isExecutorsLoading = executorsSearchStatus === 'loading';

    return {
        selectedItems,
        hasProducts,
        hasServices,
        hasContent,
        productItemsForFilter,
        serviceIdsForFilter,
        isMasterDelivery,
        needServiceMasterSection,
        masterAvailable,
        deliveryType,
        clientVisitPriceData,
        minVisitPrice,
        visitPriceForTotal,
        hasSchedule,
        emailValid,
        canSubmit,
        isExecutorsLoading,
    };
}
