import { EServiceCategory } from '../model/e-service-category';

export function getCategoryLabel(category: EServiceCategory): string {
    const labels: Record<EServiceCategory, string> = {
        [EServiceCategory.HOUSEHOLD]: 'Бытовой',
        [EServiceCategory.COTTAGE]: 'Коттеджный',
        [EServiceCategory.INDUSTRIAL]: 'Промышленный',
        [EServiceCategory.DELIVERY]: 'Доставка',
    };
    return labels[category];
}
