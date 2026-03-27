import { describe, it, expect, beforeEach } from 'vitest';
import { useRealEstateWizardStore } from './real-estate-wizard.store';

describe('useRealEstateWizardStore', () => {
    beforeEach(() => {
        useRealEstateWizardStore.getState().reset();
    });

    it('должен иметь корректное начальное состояние', () => {
        const state = useRealEstateWizardStore.getState();
        expect(state.activeType).toBe('house');
        expect(state.residents).toBe(2);
        expect(state.activeSource).toBe('waterSupply');
        expect(state.depthWaterSource).toBeNull();
        expect(state.coordinates).toBeNull();
        expect(state.address).toBeNull();
        expect(state.progress).toBe(30);
        expect(state.waterIntakePoints).toEqual({
            toilet: 0,
            sink: 0,
            bath: 0,
            washingMachine: 0,
            dishWasher: 0,
            showerCabin: 0,
        });
    });

    it('должен обновлять тип объекта', () => {
        useRealEstateWizardStore.getState().setActiveType('apartment');
        expect(useRealEstateWizardStore.getState().activeType).toBe('apartment');
    });

    it('должен обновлять источник воды', () => {
        useRealEstateWizardStore.getState().setActiveSource('borehole');
        expect(useRealEstateWizardStore.getState().activeSource).toBe('borehole');
    });

    it('должен обновлять количество жильцов', () => {
        useRealEstateWizardStore.getState().setResidents(5);
        expect(useRealEstateWizardStore.getState().residents).toBe(5);
    });

    it('должен инкрементировать точки водоразбора', () => {
        useRealEstateWizardStore.getState().incrementWaterIntakePoint('toilet');
        useRealEstateWizardStore.getState().incrementWaterIntakePoint('toilet');
        expect(useRealEstateWizardStore.getState().waterIntakePoints.toilet).toBe(2);
    });

    it('не должен декрементировать ниже 0', () => {
        useRealEstateWizardStore.getState().decrementWaterIntakePoint('sink');
        expect(useRealEstateWizardStore.getState().waterIntakePoints.sink).toBe(0);
    });

    it('должен декрементировать корректно', () => {
        useRealEstateWizardStore.getState().incrementWaterIntakePoint('bath');
        useRealEstateWizardStore.getState().incrementWaterIntakePoint('bath');
        useRealEstateWizardStore.getState().decrementWaterIntakePoint('bath');
        expect(useRealEstateWizardStore.getState().waterIntakePoints.bath).toBe(1);
    });

    it('должен устанавливать координаты', () => {
        const coords = { latitude: 55.75, longitude: 37.62 };
        useRealEstateWizardStore.getState().setCoordinates(coords);
        expect(useRealEstateWizardStore.getState().coordinates).toEqual(coords);
    });

    it('должен обновлять прогресс', () => {
        useRealEstateWizardStore.getState().setProgress(80);
        expect(useRealEstateWizardStore.getState().progress).toBe(80);
    });

    it('должен сбрасывать состояние в начальное', () => {
        useRealEstateWizardStore.getState().setActiveType('prom');
        useRealEstateWizardStore.getState().setResidents(10);
        useRealEstateWizardStore.getState().incrementWaterIntakePoint('toilet');
        useRealEstateWizardStore.getState().reset();

        const state = useRealEstateWizardStore.getState();
        expect(state.activeType).toBe('house');
        expect(state.residents).toBe(2);
        expect(state.waterIntakePoints.toilet).toBe(0);
    });
});
