import type { TCartItem, TCartServiceItem } from '@/shared/model';
import type { EServiceCategory } from '@/shared/model';
import { getServiceInfo } from './get-service-info';

/**
 * Возвращает активные услуги товара, относящиеся к указанной категории.
 * Активная услуга: checked=true и count>0.
 */
export function getServicesForCategory(
    cartItem: TCartItem,
    category: EServiceCategory | undefined,
): Array<[string, TCartServiceItem]> {
    return Object.entries(cartItem.services ?? {}).filter(
        ([, s]) => s.checked && s.count > 0 && getServiceInfo(s)?.category === category,
    );
}
