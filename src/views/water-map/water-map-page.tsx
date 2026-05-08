'use client';

import { PageTitle, WaterDrop } from '@/shared/ui';

/**
 * WaterMapPage — главная страница карты качества воды.
 *
 * Phase 3 (текущая): placeholder с hero-каплей + skeleton под heatmap.
 * Phase 4: подключение реальной maplibre карты с heatmap слоем
 *         (порт прототипа prostor-heatmap-mobile-standalone.html
 *         + live fetch /water-analysis/heatmap).
 *
 * NB: не используем `<PageContainer>` потому что карта в Phase 4 будет
 * edge-to-edge (без 1-2.5rem padding'а от page-container). Hero header
 * имеет свой padding через bg-base-100 секцию. PageTitle используется
 * для consistency с другими страницами.
 *
 * См. docs/features/prostor-water-pivot.md в slovo репо для контекста.
 */
export function WaterMapPage() {
    return (
        <div className="flex flex-col min-h-full bg-base-200">
            {/* Hero header с каплей. bg-base-100 даёт visual separation от
                skeleton-карты ниже (bg-base-200). Auto-adapts к dark theme. */}
            <header className="bg-base-100 px-4 py-6 border-b border-base-content/10">
                <div className="flex items-center gap-3 max-w-screen-md mx-auto">
                    <WaterDrop size={48} animated />
                    <div className="flex flex-col">
                        <PageTitle>Карта качества воды</PageTitle>
                        <p className="text-sm text-base-content/70">
                            Москва и Подмосковье · 15 504 анализа
                        </p>
                    </div>
                </div>
            </header>

            {/* Map area placeholder с skeleton background.
                Класс water-map-skeleton-bg в globals.css имеет варианты light/dark. */}
            <div className="water-map-skeleton-bg flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4">
                    <WaterDrop size={72} animated />
                </div>
                <h2 className="text-2xl font-bold text-base-content mb-2">Скоро здесь</h2>
                <p className="text-base-content/70 max-w-sm leading-relaxed">
                    Тепловая карта качества воды в твоём районе. Видишь, какие проблемы у соседей —
                    и сразу подбираешь фильтр под свой адрес.
                </p>

                {/* Список того что будет */}
                <ul className="mt-6 flex flex-col gap-2 text-sm text-base-content/60">
                    <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-success" />
                        Жёсткость, железо, марганец, мутность по районам
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-warning" />
                        Похожие анализы в радиусе 5–50 км
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-info" />
                        Подбор оборудования по твоей воде
                    </li>
                </ul>
            </div>
        </div>
    );
}
