import { EServiceGrade } from '../model/e-service-grade';

export function getGradeLabel(grade: EServiceGrade): string {
    const labels: Record<EServiceGrade, string> = {
        [EServiceGrade.COURIER]: 'Курьер',
        [EServiceGrade.SPECIALIST]: 'Специалист',
        [EServiceGrade.SENIOR_SPECIALIST]: 'Старший специалист',
        [EServiceGrade.MASTER]: 'Мастер',
    };
    return labels[grade];
}
