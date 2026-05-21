'use client';

import { BottomSheetModal } from '@/shared/ui';
import type { TAquiferLayerCount } from '@/entities/water-analysis';
import { aquiferLayerLabel, aquiferLayerColor, parseMaplibreObject } from '../lib';

type TDepthPopupData = {
    coords: [number, number];
    properties: Record<string, unknown>;
};

type TDepthPopupProps = {
    data: TDepthPopupData | null;
    onClose: () => void;
};

/**
 * Popup при клике на cell depth-map. Показывает агрегаты глубин:
 *  - count + median (P50) с p25/p75 + min/max
 *  - dominantLayerId — основной aquifer-горизонт в cell
 *  - aquiferLayers — 5-bucket распределение
 *  - pctWell — % скважин (vs колодцы)
 *
 * UX для бурильщиков: «в радиусе 5км типичная скважина — 75м,
 * горизонт sandy_limestone, 12 точек, 90% — скважины».
 */
export function DepthPopup({ data, onClose }: TDepthPopupProps) {
    const props = data?.properties as
        | {
              count?: number;
              median?: number;
              p25?: number;
              p75?: number;
              minDepth?: number;
              maxDepth?: number;
              dominantLayerId?: string;
              pctWell?: number;
              aquiferLayers?: TAquiferLayerCount[] | string;
          }
        | undefined;

    // aquiferLayers — maplibre сериализует array properties в JSON-string при
    // доступе через click event. Normalize обратно через общий util.
    const aquifers = parseMaplibreObject<TAquiferLayerCount[]>(props?.aquiferLayers, []);

    return (
        <BottomSheetModal
            isOpen={!!data}
            onClose={onClose}
            title="Глубина скважин в зоне"
            className="sm:max-w-2xl"
        >
            {data && props && (
                <>
                    {/* Header */}
                    <div className="-mt-2 pb-2 border-b border-base-content/10">
                        <p className="text-xs text-base-content/55">
                            Координаты {data.coords[0].toFixed(3)}, {data.coords[1].toFixed(3)}
                        </p>
                        <p className="text-sm text-base-content mt-0.5">
                            <b>{props.count ?? 0}</b> точек · <b>{props.pctWell ?? 0}%</b>{' '}
                            <span className="text-base-content/60">скважин</span>
                        </p>
                        {props.dominantLayerId && (
                            <p className="text-xs leading-snug mt-1">
                                <span
                                    className="inline-block size-2 rounded-full mr-1.5 align-middle"
                                    style={{
                                        backgroundColor: aquiferLayerColor(props.dominantLayerId),
                                    }}
                                />
                                <span className="text-base-content/80">Основной горизонт: </span>
                                <b>{aquiferLayerLabel(props.dominantLayerId)}</b>
                            </p>
                        )}
                    </div>

                    {/* Метрики глубины */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/55 mb-2">
                            Глубина бурения
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <DepthStat label="Медиана" value={fmtDepth(props.median)} />
                            <DepthStat
                                label="IQR (P25–P75)"
                                value={`${fmtDepth(props.p25)} – ${fmtDepth(props.p75)}`}
                            />
                            <DepthStat
                                label="Диапазон"
                                value={`${fmtDepth(props.minDepth)} – ${fmtDepth(props.maxDepth)}`}
                            />
                        </div>
                    </section>

                    {/* Распределение по горизонтам */}
                    {aquifers.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/55 mb-2">
                                Распределение по горизонтам
                            </h3>
                            <ul className="space-y-1.5">
                                {aquifers.map((layer) => (
                                    <AquiferBar key={layer.id} layer={layer} />
                                ))}
                            </ul>
                        </section>
                    )}

                    <p className="text-[10px] text-base-content/40 leading-snug pt-1">
                        Агрегат по скважинам/колодцам в cell 0.05° (≈5.5 км). Используйте как
                        ориентир для планирования сметы бурения.
                    </p>
                </>
            )}
        </BottomSheetModal>
    );
}

function DepthStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-base-200/60 py-1.5 px-2">
            <p className="text-[10px] uppercase tracking-wider text-base-content/50 leading-none">
                {label}
            </p>
            <p className="text-sm font-bold mt-0.5 leading-tight text-base-content tabular-nums">
                {value}
            </p>
        </div>
    );
}

function AquiferBar({ layer }: { layer: TAquiferLayerCount }) {
    const pct = Math.max(0, Math.min(100, layer.pct));
    return (
        <li className="flex items-center gap-2 text-xs">
            <span
                className="block size-2 rounded-sm shrink-0"
                style={{ backgroundColor: aquiferLayerColor(layer.id) }}
                aria-hidden
            />
            <span className="text-base-content/80 flex-1 truncate">{layer.label}</span>
            <div className="w-20 h-1.5 rounded-full bg-base-200 overflow-hidden shrink-0">
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: aquiferLayerColor(layer.id),
                    }}
                />
            </div>
            <span className="text-base-content/60 tabular-nums w-8 text-right shrink-0">
                {pct}%
            </span>
            <span className="text-base-content/40 tabular-nums w-6 text-right shrink-0">
                {layer.count}
            </span>
        </li>
    );
}

function fmtDepth(v: unknown): string {
    if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
    return `${Math.round(v)}м`;
}
