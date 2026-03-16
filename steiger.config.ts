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
]);
