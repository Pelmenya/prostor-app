import { EMasterSpecialization } from '../model/e-master-specialization';
import { EServiceGrade } from '../model/e-service-grade';

export function getCategoriesByGrade(grade: EServiceGrade): EMasterSpecialization[] {
    const map: Record<EServiceGrade, EMasterSpecialization[]> = {
        [EServiceGrade.SENIOR_SPECIALIST]: [
            EMasterSpecialization.HOUSEHOLD,
            EMasterSpecialization.COTTAGE,
            EMasterSpecialization.INDUSTRIAL,
            EMasterSpecialization.DELIVERY,
        ],
        [EServiceGrade.SPECIALIST]: [
            EMasterSpecialization.HOUSEHOLD,
            EMasterSpecialization.COTTAGE,
            EMasterSpecialization.DELIVERY,
        ],
        [EServiceGrade.MASTER]: [EMasterSpecialization.HOUSEHOLD, EMasterSpecialization.DELIVERY],
        [EServiceGrade.COURIER]: [EMasterSpecialization.DELIVERY],
    };
    return map[grade];
}
