import type { TCartServiceItem } from '@/shared/model';
import type { TLegacyServiceEntry } from '../model/types/t-legacy-service';

type TServiceInfo = {
    id?: string;
    name?: string;
    category?: string;
};

/**
 * Возвращает информацию об услуге из снэпшота заказа,
 * поддерживая оба формата: новый (serviceInfo) и legacy (service).
 */
export function getServiceInfo(service: TCartServiceItem): TServiceInfo | undefined {
    return service.serviceInfo ?? (service as TLegacyServiceEntry).service;
}
