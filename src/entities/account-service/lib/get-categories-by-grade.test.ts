import { describe, expect, it } from 'vitest';
import { getCategoriesByGrade } from './get-categories-by-grade';
import { EServiceGrade } from '../model/e-service-grade';
import { EMasterSpecialization } from '../model/e-master-specialization';

describe('getCategoriesByGrade', () => {
    it('SENIOR_SPECIALIST имеет все 4 категории', () => {
        const categories = getCategoriesByGrade(EServiceGrade.SENIOR_SPECIALIST);
        expect(categories).toHaveLength(4);
        expect(categories).toContain(EMasterSpecialization.HOUSEHOLD);
        expect(categories).toContain(EMasterSpecialization.COTTAGE);
        expect(categories).toContain(EMasterSpecialization.INDUSTRIAL);
        expect(categories).toContain(EMasterSpecialization.DELIVERY);
    });

    it('SPECIALIST не имеет INDUSTRIAL', () => {
        const categories = getCategoriesByGrade(EServiceGrade.SPECIALIST);
        expect(categories).not.toContain(EMasterSpecialization.INDUSTRIAL);
        expect(categories).toContain(EMasterSpecialization.HOUSEHOLD);
    });

    it('MASTER имеет только HOUSEHOLD и DELIVERY', () => {
        const categories = getCategoriesByGrade(EServiceGrade.MASTER);
        expect(categories).toHaveLength(2);
        expect(categories).toContain(EMasterSpecialization.HOUSEHOLD);
        expect(categories).toContain(EMasterSpecialization.DELIVERY);
    });

    it('COURIER имеет только DELIVERY', () => {
        const categories = getCategoriesByGrade(EServiceGrade.COURIER);
        expect(categories).toEqual([EMasterSpecialization.DELIVERY]);
    });
});
