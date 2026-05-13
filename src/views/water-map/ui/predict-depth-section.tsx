'use client';

import type { TAquiferLayerCount } from '@/entities/water-analysis';
import { aquiferLayerColor, aquiferLayerLabel, useDepthPredict } from '../lib';
import { IntervalBarChart } from './interval-bar-chart';

type TPredictDepthSectionProps = {
    lat: number;
    lon: number;
    /** Открыта ли модалка — определяет enable запроса. */
    enabled: boolean;
};

/**
 * Секция «Глубина бурения» в predict-modal. Интервальный прогноз глубины
 * (P10-P90 / IQR / hardRange + pointEstimate) + most-likely слой +
 * 5-bucket распределение.
 *
 * Использует `useDepthPredict` с тем же pin'ом что у /predict.
 * intakeType='all' — общий взгляд для типичного клиента (бурильщик может
 * сам выбрать через AquiferStatsModal toggle, который persistит intakeType).
 */
export function PredictDepthSection({ lat, lon, enabled }: TPredictDepthSectionProps) {
    const query = enabled ? { lat, lon, intakeType: 'all' as const } : null;
    const { data, isLoading } = useDepthPredict(query);

    if (isLoading) {
        return (
            <div className="rounded-lg bg-base-200/40 px-3 py-3 flex items-center gap-2 text-xs text-base-content/60">
                <span className="loading loading-spinner loading-xs" />
                Считаем глубину бурения…
            </div>
        );
    }

    if (!data || data.insufficientData || !data.predicted) {
        return null;
    }

    const { predicted, layerDistribution, mostLikelyAquiferLayer, nNeighbors, medianDistKm } = data;

    return (
        <details open className="group rounded-lg bg-base-200/40 px-3 py-2">
            <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">⛏</span>
                    <span className="text-sm font-bold text-base-content">Глубина бурения</span>
                    {mostLikelyAquiferLayer && (
                        <span className="text-xs text-base-content/60 truncate hidden sm:inline">
                            · {mostLikelyAquiferLayer}
                        </span>
                    )}
                </div>
                <span className="text-base-content/40 group-open:rotate-180 transition text-xs">
                    ▾
                </span>
            </summary>

            <div className="pt-2.5 space-y-3">
                {/* Метаданные */}
                <p className="text-[11px] text-base-content/60 leading-snug">
                    По <b>{nNeighbors}</b> соседям, медиана расстояния{' '}
                    <b>{medianDistKm.toFixed(1)}</b> км.
                    {mostLikelyAquiferLayer && (
                        <>
                            {' '}
                            Наиболее вероятный горизонт:{' '}
                            <b className="text-base-content">{mostLikelyAquiferLayer}</b>.
                        </>
                    )}
                </p>

                {/* Interval-bar chart глубины */}
                <div className="rounded-md bg-base-100 px-3 py-2 border border-base-content/5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-base-content">
                            Прогноз глубины
                        </span>
                        <span className="text-xs text-base-content/60">
                            ~{Math.round(predicted.pointEstimate)} м
                        </span>
                    </div>
                    <IntervalBarChart
                        hardRange={predicted.hardRange}
                        interval={predicted.interval}
                        iqr={predicted.iqr}
                        pointEstimate={predicted.pointEstimate}
                    />
                    <p className="text-[10px] text-base-content/55 leading-snug mt-1">
                        Жёлтый — наблюдаемый диапазон, синий — 80% соседей (P10-P90), тёмный —
                        типичный IQR (P25-P75).
                    </p>
                </div>

                {/* 5-bucket distribution */}
                {layerDistribution.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-base-content/55 mb-1.5">
                            Распределение соседей
                        </h4>
                        <ul className="space-y-1">
                            {layerDistribution.map((bucket) => (
                                <LayerBucket
                                    key={bucket.id}
                                    bucket={bucket}
                                    highlight={
                                        mostLikelyAquiferLayer === aquiferLayerLabel(bucket.id)
                                    }
                                />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </details>
    );
}

function LayerBucket({ bucket, highlight }: { bucket: TAquiferLayerCount; highlight: boolean }) {
    const pct = Math.max(0, Math.min(100, bucket.pct));
    const color = aquiferLayerColor(bucket.id);
    return (
        <li className={`flex items-center gap-2 text-xs ${highlight ? 'font-semibold' : ''}`}>
            <span
                className="block size-2 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
            />
            <span className="text-base-content/80 flex-1 truncate">{bucket.label}</span>
            <div className="w-16 h-1 rounded-full bg-base-200 overflow-hidden shrink-0">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-base-content/60 tabular-nums w-7 text-right shrink-0">
                {pct}%
            </span>
        </li>
    );
}
