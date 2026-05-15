'use client';

import Link from 'next/link';
import { useCartStore } from '@/entities/cart';
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
 * Slovo handoff 2026-05-15 13:05 (commit `dbf8589`): equipment-suggest
 * response теперь содержит `externalId` (MoySklad UUID), `imageUrl`
 * (presigned MinIO, TTL 1ч) и `salePriceKopecks`. Не нужен второй round-trip
 * через crm-back МойСклад proxy для thumbnails — slovo сам резолвит.
 */
export function EquipmentModal() {
    const open = useWaterMapStore((s) => s.equipmentOpen);
    const setOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const source = useEquipmentSourceStore((s) => s.source);
    const addProduct = useCartStore((s) => s.addProduct);

    const body = open && source ? { lat: source.lat, lon: source.lon, topK: 5 } : null;
    const { data, isLoading, isError } = useEquipmentSuggest(body);

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
                            {data.recommendations.map((rec) => {
                                const matched = data.problems.find(
                                    (p) => p.paramCode === rec.matchedProblem,
                                );
                                const priceRub =
                                    rec.salePriceKopecks !== null
                                        ? rec.salePriceKopecks / 100
                                        : null;
                                const handleAddToCart = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // addProduct internally читает только id/name/description,
                                    // но TProduct требует `attributes` массив — slovo
                                    // recommendation не имеет, передаём пустой. cart-sync
                                    // потом обогатит при authed merge с бэка.
                                    addProduct(
                                        {
                                            id: rec.externalId,
                                            name: rec.name,
                                            description: rec.description,
                                            attributes: [],
                                        },
                                        1,
                                        priceRub ?? 0,
                                    );
                                };
                                return (
                                    <li
                                        key={rec.externalId}
                                        className="rounded-lg border border-base-content/10 bg-base-100 overflow-hidden"
                                    >
                                        <Link
                                            href={`/product/${rec.externalId}`}
                                            onClick={() => setOpen(false)}
                                            className="flex gap-3 p-3 hover:bg-base-200/30 transition"
                                        >
                                            {rec.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={rec.imageUrl}
                                                    alt={rec.name}
                                                    className="size-20 rounded-md object-cover bg-base-200 shrink-0"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="size-20 rounded-md bg-base-200 shrink-0 flex items-center justify-center text-base-content/30 text-xs">
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
                                                {priceRub !== null && (
                                                    <p className="text-sm font-bold text-base-content mt-1.5 tabular-nums">
                                                        {priceRub.toLocaleString('ru-RU')} ₽
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex gap-2 px-3 pb-3 -mt-1">
                                            <Link
                                                href={`/product/${rec.externalId}`}
                                                onClick={() => setOpen(false)}
                                                className="btn btn-sm btn-ghost flex-1 normal-case"
                                            >
                                                Подробнее
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={handleAddToCart}
                                                className="btn btn-sm btn-primary flex-1 normal-case"
                                                disabled={priceRub === null}
                                            >
                                                В корзину
                                            </button>
                                        </div>
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
