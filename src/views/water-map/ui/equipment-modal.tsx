'use client';

import Link from 'next/link';
import { useProductThumbnails } from '@/entities/product';
import { BottomSheetModal } from '@/shared/ui';
import { useEquipmentSourceStore, useWaterMapStore } from '../model';
import { paramFullLabel, useEquipmentSuggest } from '../lib';
import { SeverityBadge } from './severity-badge';

/**
 * Modal с подбором оборудования. Координаты берутся из `useEquipmentSourceStore`
 * (источник = `pin` или `cell`). Семантика отражается в title:
 *  - `pin` → «По вашему адресу»
 *  - `cell` → «По выбранной зоне»
 *
 * Открывается через `useWaterMapStore.setEquipmentOpen(true)` — caller (FAB,
 * cell-popup CTA, etc.) обязан выставить source ДО open. EquipmentModal
 * ничего не знает про откуда coords пришли.
 *
 * NB: SKU/orderNumber в каталоге PROSTOR обычно равен sku — но catalog API
 * сейчас живёт на другом backend. После интеграции catalog добавим deep-link.
 */
export function EquipmentModal() {
    const open = useWaterMapStore((s) => s.equipmentOpen);
    const setOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const source = useEquipmentSourceStore((s) => s.source);

    const body = open && source ? { lat: source.lat, lon: source.lon, topK: 5 } : null;
    const { data, isLoading, isError } = useEquipmentSuggest(body);

    // Thumbnails из МойСклад через crm-back (slovo response даёт sku которое
    // mapping'ом в МойСклад UUID — uses-product-thumbnails batched useQueries
    // с дедупом cache). При закрытом modal списка нет — hook idempotent
    // на пустой массив.
    const skus = data?.recommendations.map((r) => r.sku) ?? [];
    const { imageUrls } = useProductThumbnails(skus);

    const title =
        source?.source === 'cell' ? 'Подбор по выбранной зоне' : 'Подбор по вашему адресу';

    return (
        <BottomSheetModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title={title}
            className="sm:max-w-2xl"
        >
            {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-base-content/60">
                    <span className="loading loading-spinner loading-md mb-3" />
                    <p className="text-sm">Подбираем фильтры под прогноз воды…</p>
                </div>
            )}

            {isError && (
                <div className="py-12 text-center">
                    <p className="text-sm text-error font-medium">
                        Не удалось получить рекомендации
                    </p>
                </div>
            )}

            {data && data.insufficientData && (
                <div className="py-10 text-center">
                    <p className="text-sm font-medium text-base-content">
                        Недостаточно данных по соседям
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 leading-snug">
                        Не удалось спрогнозировать химию воды для этой точки.
                    </p>
                </div>
            )}

            {data && !data.insufficientData && data.problems.length === 0 && (
                <div className="py-10 text-center">
                    <p className="text-sm font-medium text-success">
                        Серьёзных проблем у соседей не найдено
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 leading-snug">
                        Можно использовать водоразборные модели общего назначения.
                    </p>
                </div>
            )}

            {data && !data.insufficientData && data.problems.length > 0 && (
                <>
                    {/* Problems summary */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
                            Найденные проблемы
                        </h3>
                        <ul className="flex flex-wrap gap-2">
                            {data.problems.map((p) => (
                                <li key={p.paramCode}>
                                    <SeverityBadge status={p.severity} size="sm">
                                        {paramFullLabel(p.paramCode)}
                                    </SeverityBadge>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Recommendations */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
                            Рекомендованное оборудование
                        </h3>
                        <ul className="space-y-3">
                            {data.recommendations.map((rec, idx) => {
                                const matched = data.problems.find(
                                    (p) => p.paramCode === rec.matchedProblem,
                                );
                                // Image priority: МойСклад thumbnail (full
                                // resolution, через crm-back proxy) → fallback
                                // на slovo `imageUrl` если есть → placeholder
                                const imageUrl = imageUrls[rec.sku] ?? rec.imageUrl;
                                return (
                                    <li key={`${rec.sku}-${idx}`}>
                                        <Link
                                            href={`/product/${rec.sku}`}
                                            onClick={() => setOpen(false)}
                                            className="block rounded-lg border border-base-content/10 bg-base-100 p-3 flex gap-3 hover:border-primary/40 hover:bg-base-200/30 transition"
                                        >
                                            {imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageUrl}
                                                    alt={rec.name}
                                                    className="size-16 rounded-md object-cover bg-base-200 shrink-0"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="size-16 rounded-md bg-base-200 shrink-0 flex items-center justify-center text-base-content/30 text-xs">
                                                    нет фото
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium text-base-content leading-tight line-clamp-2">
                                                        {rec.name}
                                                    </p>
                                                    {matched && (
                                                        <SeverityBadge
                                                            status={matched.severity}
                                                            size="sm"
                                                        >
                                                            {paramFullLabel(rec.matchedProblem)}
                                                        </SeverityBadge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-primary/90 mt-1 leading-snug">
                                                    {rec.reason}
                                                </p>
                                                {rec.description && (
                                                    <p className="text-xs text-base-content/60 mt-1.5 leading-snug line-clamp-2">
                                                        {rec.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Footer info */}
                    <p className="text-[10px] text-base-content/40 leading-snug pt-1">
                        Прогноз построен по {data.nNeighbors} соседям, медиана расстояния{' '}
                        {data.medianDistKm.toFixed(1)} км. Точная картина — после реального анализа
                        воды.
                    </p>
                </>
            )}
        </BottomSheetModal>
    );
}
