import type { TCartItem, TCartServiceItem, EServiceCategory } from '@/shared/model';
import { EServiceCategory as ServiceCategory } from '@/shared/model';
import type { TOrderCartState } from '../model/types/t-order';
import { getServiceInfo } from './get-service-info';

const VALID_CATEGORIES = new Set<string>(Object.values(ServiceCategory));

function getServiceCategory(s: TCartServiceItem): EServiceCategory | undefined {
    const raw = getServiceInfo(s)?.category;
    if (raw === undefined || !VALID_CATEGORIES.has(raw)) return undefined;
    return raw as EServiceCategory;
}

function hasCheckedServicesByCategory(
    items: TCartItem[],
    category: EServiceCategory | undefined,
): boolean {
    return items.some((it) =>
        Object.values(it.services || {}).some(
            (s: TCartServiceItem) =>
                s?.checked &&
                (category === undefined
                    ? getServiceCategory(s) === undefined
                    : getServiceCategory(s) === category),
        ),
    );
}

type TOrderPositionsGrouped = {
    items: TCartItem[];
    hasProducts: boolean;
    hasInstallation: boolean;
    hasMaintenance: boolean;
    hasGeneral: boolean;
};

export function groupOrderPositions(
    cartState: TOrderCartState | undefined,
): TOrderPositionsGrouped {
    const items: TCartItem[] = Object.values(cartState?.items ?? {});

    return {
        items,
        hasProducts: items.some((it) => it?.count > 0 && it?.product),
        hasInstallation: hasCheckedServicesByCategory(items, ServiceCategory.MONTAZH),
        hasMaintenance: hasCheckedServicesByCategory(
            items,
            ServiceCategory.SERVISNOE_OBSLUZHIVANIE,
        ),
        hasGeneral: hasCheckedServicesByCategory(items, undefined),
    };
}
