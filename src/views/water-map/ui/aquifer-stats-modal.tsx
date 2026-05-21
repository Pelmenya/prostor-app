'use client';

import { BottomSheetModal } from '@/shared/ui';
import type { TAquiferLayerStats, TIntakeType } from '@/entities/water-analysis';
import { useWaterMapStore } from '../model';
import {
    aquiferLayerColor,
    formatParamValue,
    MO_BBOX,
    paramFullLabel,
    useAquiferStats,
} from '../lib';

const INTAKE_OPTIONS: ReadonlyArray<{ id: TIntakeType; label: string }> = [
    { id: 'all', label: 'Все' },
    { id: 'well', label: 'Скважины' },
    { id: 'well_dug', label: 'Колодцы' },
];

const TOP_CHEMISTRY: ReadonlyArray<string> = ['iron_total', 'hardness_total', 'nitrates'];

/**
 * Стратифицированная chemistry по 5 водоносным горизонтам в bbox МО.
 *
 * Drilling storytelling «бури глубже = чище вода»:
 *  - Верховодка 0-15м — iron 0.8, hardness 7+
 *  - Артезианский 200м+ — iron 0.05, hardness 4
 * Сравниваем headline-параметры (iron, hardness, nitrates) от поверхностных
 * к глубоким — drilling-юзер видит trade-off глубины vs сметы.
 *
 * Открывается через useWaterMapStore.aquiferStatsOpen из тапа
 * «Тип воды в районе →» в LayerPanel.
 */
export function AquiferStatsModal() {
    const open = useWaterMapStore((s) => s.aquiferStatsOpen);
    const setOpen = useWaterMapStore((s) => s.setAquiferStatsOpen);
    const intakeType = useWaterMapStore((s) => s.intakeType);
    const setIntakeType = useWaterMapStore((s) => s.setIntakeType);

    // Bbox — статичный МО (не реактивный к pan карты), как договаривались:
    // aquifer-stats — region-wide analytics, не следует за viewport.
    const query = open ? { ...MO_BBOX, intakeType } : null;
    const { data, isLoading, isError } = useAquiferStats(query);

    return (
        <BottomSheetModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Тип воды в районе"
            className="sm:max-w-2xl"
        >
            {/* Filter intakeType */}
            <div className="flex items-center gap-2 -mt-2">
                <span className="text-xs text-base-content/55">Источник:</span>
                <div className="inline-flex rounded-full border border-base-content/15 bg-base-100 p-0.5 text-xs">
                    {INTAKE_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setIntakeType(opt.id)}
                            className={`px-2.5 py-1 rounded-full font-medium transition ${
                                intakeType === opt.id
                                    ? 'bg-primary text-primary-content'
                                    : 'text-base-content/70 hover:text-base-content'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-base-content/60">
                    <span className="loading loading-spinner loading-md mb-3" />
                    <p className="text-sm">Анализируем горизонты Подмосковья…</p>
                </div>
            )}

            {isError && (
                <div className="py-10 text-center">
                    <p className="text-sm text-error font-medium">
                        Не удалось загрузить статистику
                    </p>
                </div>
            )}

            {data && data.layers.length > 0 && (
                <>
                    {/* Сводка */}
                    <div className="rounded-lg bg-base-200/40 px-3 py-2 text-xs leading-snug">
                        <p className="text-base-content/80">
                            <b>{data.totalWells.toLocaleString('ru-RU')}</b> точек ·{' '}
                            <b>{data.samplesUsed.toLocaleString('ru-RU')}</b> анализов в Подмосковье
                        </p>
                        {data.dominantLayerId && (
                            <p className="text-base-content/60 mt-0.5">
                                Основной горизонт района:{' '}
                                <b className="text-base-content">
                                    {data.layers.find((l) => l.id === data.dominantLayerId)
                                        ?.label ?? data.dominantLayerId}
                                </b>
                            </p>
                        )}
                    </div>

                    {/* 5 секций per layer — sorted by minDepth (uppermost first) */}
                    <ul className="space-y-3">
                        {[...data.layers]
                            .sort((a, b) => a.minDepth - b.minDepth)
                            .map((layer) => (
                                <AquiferLayerCard key={layer.id} layer={layer} />
                            ))}
                    </ul>

                    {/* Storytelling hint */}
                    <p className="text-[11px] text-base-content/55 leading-snug pt-1 border-t border-base-content/10">
                        Чем глубже бурение — тем стабильнее химия и меньше превышений ПДК. Сравните
                        железо/жёсткость в верхних и нижних горизонтах.
                    </p>
                </>
            )}
        </BottomSheetModal>
    );
}

function AquiferLayerCard({ layer }: { layer: TAquiferLayerStats }) {
    const color = aquiferLayerColor(layer.id);
    const pct = Math.max(0, Math.min(100, layer.pct));

    return (
        <li className="rounded-lg border border-base-content/10 bg-base-100 p-3">
            <div className="flex items-start gap-3">
                <span
                    className="block size-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-base-content leading-tight truncate">
                            {layer.label}
                        </h4>
                        <span className="text-xs text-base-content/55 shrink-0 tabular-nums">
                            {pct}%
                        </span>
                    </div>
                    <p className="text-xs text-base-content/60 leading-tight mt-0.5">
                        <b>{layer.count.toLocaleString('ru-RU')}</b> точек
                        {layer.medianDepth !== undefined && (
                            <>
                                {' · медиана глубины '}
                                <b>{Math.round(layer.medianDepth)}м</b>
                            </>
                        )}
                        {layer.pctWell !== undefined && (
                            <>
                                {' · '}
                                <b>{layer.pctWell}%</b> скважин
                            </>
                        )}
                    </p>

                    {/* % bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-base-200 overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                    </div>

                    {/* Топ-3 chemistry */}
                    {Object.keys(layer.medianChemistry).length > 0 && (
                        <ul className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                            {TOP_CHEMISTRY.map((code) => {
                                const value = layer.medianChemistry[code];
                                if (value === undefined) return null;
                                return (
                                    <li key={code} className="rounded-md bg-base-200/60 px-2 py-1">
                                        <p className="text-base-content/55 leading-none truncate">
                                            {paramFullLabel(code)}
                                        </p>
                                        <p className="font-medium text-base-content mt-0.5 leading-none tabular-nums">
                                            {formatParamValue(code, value)}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </li>
    );
}
