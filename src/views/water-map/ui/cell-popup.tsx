'use client';

import { useState } from 'react';
import { BottomSheetModal } from '@/shared/ui';
import type { TParamBreakdown } from '@/entities/water-analysis';
import { useEquipmentSourceStore, useWaterMapStore } from '../model';
import { formatPdk, paramFullLabel, paramLabel, useHeatmapCellDetail } from '../lib';

const CELL_GRID = 0.05; // hardcoded — фронт работает с тем же default что в backend

type TCellPopupProps = {
    /** [lat, lon] cell — null если popup закрыт. */
    coords: [number, number] | null;
};

/**
 * BottomSheetModal с детальным breakdown выбранной heatmap-cell.
 * Запрашивает `POST /water-analysis/heatmap/cell` через `useHeatmapCellDetail`
 * (idempotent useQuery — повторные клики на ту же cell дадут cache hit).
 *
 * Layout:
 *  - Header: «N анализов · M с проблемами · даты»
 *  - List topProblems с severity-chip 4-level (1-25 yellow / 26-50 orange / 51-100 red)
 *  - Edge case n=1 — append «(1 анализ — мало данных)»
 *  - Range pdk (pH) — «при ПДК 6-9»
 *  - Footer collapse «В норме: K параметров»
 *  - CTA «Подобрать оборудование» → setEquipmentSource({source:'cell'}) + setEquipmentOpen
 */
export function CellPopup({ coords }: TCellPopupProps) {
    const setSelectedCellCoords = useWaterMapStore((s) => s.setSelectedCellCoords);
    const setEquipmentOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const setEquipmentSource = useEquipmentSourceStore((s) => s.setSource);
    const [inNormOpen, setInNormOpen] = useState(false);

    const query = coords ? { lat: coords[0], lon: coords[1], grid: CELL_GRID } : null;
    const { data, isLoading, isError } = useHeatmapCellDetail(query);

    const handleClose = () => {
        setSelectedCellCoords(null);
        setInNormOpen(false);
    };

    const handleEquipment = () => {
        if (!coords) return;
        setEquipmentSource({ lat: coords[0], lon: coords[1], source: 'cell' });
        setSelectedCellCoords(null); // закрываем popup
        setEquipmentOpen(true);
    };

    const footer =
        data && data.nTotal > 0 ? (
            <button type="button" onClick={handleEquipment} className="btn btn-primary w-full">
                Подобрать оборудование для зоны
            </button>
        ) : undefined;

    return (
        <BottomSheetModal
            isOpen={!!coords}
            onClose={handleClose}
            title="Детали зоны"
            footer={footer}
            className="sm:max-w-2xl"
        >
            {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-base-content/60">
                    <span className="loading loading-spinner loading-md mb-3" />
                    <p className="text-sm">Анализируем cell...</p>
                </div>
            )}

            {isError && (
                <div className="py-10 text-center">
                    <p className="text-sm text-error font-medium">Не удалось загрузить детали</p>
                </div>
            )}

            {data && data.nTotal === 0 && (
                <div className="py-10 text-center">
                    <p className="text-sm text-base-content/70">В этой зоне нет анализов</p>
                </div>
            )}

            {data && data.nTotal > 0 && (
                <>
                    {/* Header summary */}
                    <div className="-mt-2 pb-2 border-b border-base-content/10">
                        <p className="text-xs text-base-content/55">
                            Координаты {data.cellLat.toFixed(3)}, {data.cellLon.toFixed(3)}
                        </p>
                        <p className="text-sm text-base-content mt-0.5">
                            <b>{data.nTotal}</b> анализов · <b>{data.nWithExceedance}</b>{' '}
                            <span className="text-base-content/60">с проблемами</span>
                        </p>
                        <p className="text-[11px] text-base-content/50 leading-snug mt-0.5">
                            Период: {formatDate(data.earliestSampleDate)} –{' '}
                            {formatDate(data.latestSampleDate)}
                        </p>
                    </div>

                    {/* Top problems */}
                    {data.topProblems.length > 0 ? (
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/55 mb-1.5">
                                Проблемы · {data.topProblems.length}
                            </h3>
                            <ul className="space-y-1.5">
                                {data.topProblems.map((p) => (
                                    <ProblemRow key={p.paramCode} item={p} />
                                ))}
                            </ul>
                        </section>
                    ) : (
                        <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2">
                            <p className="text-sm font-medium text-success">
                                В этой зоне всё в норме
                            </p>
                            <p className="text-xs text-base-content/60 mt-0.5">
                                Ни один параметр не превышает ПДК.
                            </p>
                        </div>
                    )}

                    {/* В норме — collapsible */}
                    {data.inNormParams.length > 0 && (
                        <details
                            open={inNormOpen}
                            onToggle={(e) =>
                                setInNormOpen((e.currentTarget as HTMLDetailsElement).open)
                            }
                            className="rounded-lg bg-base-200/40 px-3 py-2"
                        >
                            <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-sm">
                                <span className="text-base-content/80">
                                    В норме · {data.inNormParams.length}{' '}
                                    {paramTail(data.inNormParams.length)}
                                </span>
                                <span className="text-base-content/40 text-xs">
                                    {inNormOpen ? '▴' : '▾'}
                                </span>
                            </summary>
                            <ul className="pt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-base-content/70">
                                {data.inNormParams.map((code) => (
                                    <li key={code}>{paramLabel(code)}</li>
                                ))}
                            </ul>
                        </details>
                    )}
                </>
            )}
        </BottomSheetModal>
    );
}

function ProblemRow({ item }: { item: TParamBreakdown }) {
    const sev = severityFromPct(item.exceedsPct);
    const sevCls = SEVERITY_CLS[sev];
    return (
        <li className="rounded-md border border-base-content/10 bg-base-100 px-3 py-2 flex items-center gap-3">
            <span className={`size-2.5 rounded-full shrink-0 ${sevCls}`} aria-hidden />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-base-content truncate">
                        {item.nameRu || paramFullLabel(item.paramCode)}
                    </span>
                    <span className="text-sm font-bold text-base-content shrink-0 tabular-nums">
                        {item.exceedsPct}%
                    </span>
                </div>
                <p className="text-[11px] text-base-content/55 leading-tight mt-0.5">
                    max {formatNumber(item.max)} {item.unit} при {formatPdk(item.pdk, item.unit)}
                    {item.n === 1 && (
                        <span className="text-warning ml-1">· 1 анализ — мало данных</span>
                    )}
                </p>
            </div>
        </li>
    );
}

const SEVERITY_CLS: Record<'mild' | 'mid' | 'high', string> = {
    mild: 'bg-warning', // 1-25
    mid: '[background-color:oklch(70%_0.18_40)]', // 26-50 orange (нет прямого daisyui)
    high: 'bg-error', // 51-100
};

function severityFromPct(pct: number): 'mild' | 'mid' | 'high' {
    if (pct >= 51) return 'high';
    if (pct >= 26) return 'mid';
    return 'mild';
}

function formatNumber(n: unknown): string {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    return Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2);
}

function formatDate(iso: string): string {
    // Простой `2026-04-26` → `26.04.2026`
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return `${m[3]}.${m[2]}.${m[1]}`;
}

function paramTail(n: number): string {
    if (n === 1) return 'параметр';
    if (n >= 2 && n <= 4) return 'параметра';
    return 'параметров';
}
