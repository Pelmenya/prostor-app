import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
    ...fsd.configs.recommended,
    {
        // Next.js App Router — не FSD-слой, игнорируем
        ignores: ['./src/app/**'],
    },
    {
        // Моки для тестов
        ignores: ['**/__mocks__/**'],
    },
    {
        // Пустые слои пока не наполнены — убрать когда появится код
        rules: {
            'fsd/insignificant-slice': 'off',
        },
    },
    {
        // features/ активно растёт, лимит 20 слайсов слишком мал
        rules: {
            'fsd/excessive-slicing': 'off',
        },
    },
]);
