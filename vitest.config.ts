import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        // Node 22+ регистрирует собственный экспериментальный глобальный `localStorage`
        // (требует `--localstorage-file`), который конфликтует с happy-dom и ломает
        // модульную инициализацию Zustand-стора (useAuthStore) при импорте в тестах.
        // Отключаем нативный webstorage в тестовых воркерах, чтобы happy-dom предоставлял
        // свой `window.localStorage` без коллизии.
        // См. также src/test/setup.ts — независимый fallback-полифилл на случай, если
        // этот флаг когда-нибудь исчезнет из конфига (WR-05).
        poolOptions: {
            forks: {
                execArgv: ['--no-experimental-webstorage'],
            },
        },
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/app/**'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
