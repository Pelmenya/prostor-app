import { EMasterSpecialization } from '../model/e-master-specialization';

export function getCategoryLabel(category: EMasterSpecialization): string {
    const labels: Record<EMasterSpecialization, string> = {
        [EMasterSpecialization.HOUSEHOLD]: 'Бытовой',
        [EMasterSpecialization.COTTAGE]: 'Коттеджный',
        [EMasterSpecialization.INDUSTRIAL]: 'Промышленный',
        [EMasterSpecialization.DELIVERY]: 'Доставка',
    };
    return labels[category];
}
