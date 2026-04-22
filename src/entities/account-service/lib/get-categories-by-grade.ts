import { EServiceCategory } from '../model/e-service-category';
import { EServiceGrade } from '../model/e-service-grade';

export function getCategoriesByGrade(grade: EServiceGrade): EServiceCategory[] {
    const map: Record<EServiceGrade, EServiceCategory[]> = {
        [EServiceGrade.SENIOR_SPECIALIST]: [
            EServiceCategory.HOUSEHOLD,
            EServiceCategory.COTTAGE,
            EServiceCategory.INDUSTRIAL,
            EServiceCategory.DELIVERY,
        ],
        [EServiceGrade.SPECIALIST]: [
            EServiceCategory.HOUSEHOLD,
            EServiceCategory.COTTAGE,
            EServiceCategory.DELIVERY,
        ],
        [EServiceGrade.MASTER]: [EServiceCategory.HOUSEHOLD, EServiceCategory.DELIVERY],
        [EServiceGrade.COURIER]: [EServiceCategory.DELIVERY],
    };
    return map[grade];
}
