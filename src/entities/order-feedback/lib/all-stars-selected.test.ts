import { describe, it, expect } from 'vitest';
import { allStarsSelected } from './all-stars-selected';
import { FEEDBACK_STRUCTURE } from './feedback-structure';

const fullParams = {
    quality: { politeness: 5, accuracy: 4, shoeChange: 3, appearance: 5 },
    competence: {
        taskUnderstanding: 4,
        productKnowledge: 5,
        explanation: 3,
        troubleshooting: 4,
    },
    speed: { punctuality: 5, normHours: 4 },
};

describe('allStarsSelected', () => {
    it('возвращает true когда все критерии заполнены', () => {
        expect(allStarsSelected(fullParams, FEEDBACK_STRUCTURE)).toBe(true);
    });

    it('возвращает false когда один критерий равен 0', () => {
        const params = {
            ...fullParams,
            quality: { ...fullParams.quality, politeness: 0 },
        };
        expect(allStarsSelected(params, FEEDBACK_STRUCTURE)).toBe(false);
    });

    it('возвращает false когда критерий отсутствует', () => {
        const withoutQuality = { competence: fullParams.competence, speed: fullParams.speed };
        expect(allStarsSelected(withoutQuality as typeof fullParams, FEEDBACK_STRUCTURE)).toBe(
            false,
        );
    });

    it('возвращает false для пустого объекта', () => {
        expect(allStarsSelected({}, FEEDBACK_STRUCTURE)).toBe(false);
    });

    it('игнорирует секции из excludeKeys', () => {
        const paramsWithoutSpeed = {
            quality: fullParams.quality,
            competence: fullParams.competence,
            speed: {},
        };
        expect(allStarsSelected(paramsWithoutSpeed, FEEDBACK_STRUCTURE, ['speed'])).toBe(true);
    });

    it('возвращает true для пустой структуры', () => {
        expect(allStarsSelected({}, [])).toBe(true);
    });
});
