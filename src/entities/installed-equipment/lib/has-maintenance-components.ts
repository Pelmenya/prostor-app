import type { TProduct } from '@/shared/model';

/** Доп. поля в МойСклад, содержащие ссылки на картриджи/расходники */
const COMPONENT_ATTRIBUTE_NAMES = [
    'Первый элемент для обслуживания',
    'Второй элемент для обслуживания',
    'Третий элемент для обслуживания',
    'Четвёртый элемент для обслуживания',
    'Пятый элемент для обслуживания',
];

/**
 * Возвращает true, если товар имеет хотя бы один элемент обслуживания
 * (картридж/расходник), заполненный в МойСклад.
 * Используется для фильтрации списка поиска при добавлении оборудования.
 */
export function hasMaintenanceComponents(product: TProduct): boolean {
    if (!product.attributes?.length) return false;
    return COMPONENT_ATTRIBUTE_NAMES.some((name) => {
        const attr = product.attributes.find((a) => a.name === name);
        // Для ссылочных атрибутов МС value — объект { meta, name }, всегда truthy
        return attr?.value != null && attr.value !== '' && attr.value !== false;
    });
}
