'use client';

import { BottomSheetModal } from '@/shared/ui';
import type { TPdkStatus, TPredictResponse } from '@/entities/water-analysis';
import { useClientPinStore, useWaterMapStore } from '../model';
import { paramFullLabel, usePredict, WATER_PARAM_META } from '../lib';
import { IntervalBarChart } from './interval-bar-chart';
import { PredictDepthSection } from './predict-depth-section';
import { SeverityBadge } from './severity-badge';

const SECTION_ORDER: ReadonlyArray<{
    key: keyof TPredictResponse['byCategory'];
    status: TPdkStatus | 'unmonitored';
}> = [
    { key: 'unsafe', status: 'unsafe' },
    { key: 'concerning', status: 'concerning' },
    { key: 'borderline', status: 'borderline' },
    { key: 'safe', status: 'safe' },
    { key: 'unmonitored', status: 'unmonitored' },
];

/**
 * Modal с прогнозом 22 параметров для пина клиента. 5 секций (unsafe/concerning/
 * borderline/safe/unmonitored) с interval-bar-chart на каждый параметр.
 *
 * CTA «Подбери фильтр» — открывает equipment-modal (тот же координаты).
 */
export function PredictModal() {
    const open = useWaterMapStore((s) => s.predictOpen);
    const setOpen = useWaterMapStore((s) => s.setPredictOpen);
    const setEquipmentOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const pin = useClientPinStore((s) => s.pin);

    const query = open && pin ? { lat: pin.lat, lon: pin.lon } : null;
    const { data, isLoading, isError } = usePredict(query);

    const footer =
        data && !data.insufficientData ? (
            <button
                type="button"
                onClick={() => {
                    setOpen(false);
                    setEquipmentOpen(true);
                }}
                className="btn btn-primary w-full"
            >
                Подобрать оборудование
            </button>
        ) : undefined;

    return (
        <BottomSheetModal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Прогноз химии воды"
            footer={footer}
            className="sm:max-w-2xl"
        >
            {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-base-content/60">
                    <span className="loading loading-spinner loading-md mb-3" />
                    <p className="text-sm">Анализируем соседей в радиусе 50 км…</p>
                </div>
            )}

            {isError && (
                <div className="py-12 text-center">
                    <p className="text-sm text-error font-medium">Не удалось получить прогноз</p>
                    <p className="text-xs text-base-content/60 mt-1">Попробуйте ещё раз позже.</p>
                </div>
            )}

            {data && data.insufficientData && (
                <div className="py-10 text-center">
                    <p className="text-sm font-medium text-base-content">
                        Недостаточно данных рядом
                    </p>
                    <p className="text-xs text-base-content/60 mt-1 leading-snug">
                        В радиусе {data.radiusKm} км нет анализов для построения прогноза.
                        Попробуйте сместить пин ближе к жилому посёлку Подмосковья.
                    </p>
                </div>
            )}

            {data && !data.insufficientData && (
                <>
                    {/* Сводка над секциями */}
                    <div className="flex items-center gap-3 text-xs text-base-content/70 -mt-2 pb-2 border-b border-base-content/10">
                        <span>
                            Соседей: <b className="text-base-content">{data.nNeighbors}</b>
                        </span>
                        <span>
                            Медиана:{' '}
                            <b className="text-base-content">{data.medianDistKm.toFixed(1)} км</b>
                        </span>
                        {data.mostLikelyAquiferLayer && (
                            <span className="ml-auto truncate">{data.mostLikelyAquiferLayer}</span>
                        )}
                    </div>

                    {/* Drilling USP-4 — глубина бурения для этой координаты */}
                    {pin && <PredictDepthSection lat={pin.lat} lon={pin.lon} enabled={open} />}

                    {SECTION_ORDER.map(({ key, status }) => {
                        const codes = data.byCategory[key];
                        if (!codes || codes.length === 0) return null;
                        const defaultOpen = status === 'unsafe' || status === 'concerning';
                        return (
                            <details
                                key={key}
                                open={defaultOpen}
                                className="group rounded-lg bg-base-200/40 px-3 py-2"
                            >
                                <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                                    <SeverityBadge status={status}>
                                        {sectionTitle(status)} · {codes.length}
                                    </SeverityBadge>
                                    <span className="text-base-content/40 group-open:rotate-180 transition text-xs">
                                        ▾
                                    </span>
                                </summary>
                                <div className="pt-2 space-y-3">
                                    {codes.map((code) => {
                                        const est = data.predicted[code];
                                        if (!est) return null;
                                        const meta =
                                            WATER_PARAM_META[code as keyof typeof WATER_PARAM_META];
                                        return (
                                            <div
                                                key={code}
                                                className="rounded-md bg-base-100 px-3 py-2 border border-base-content/5"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-sm font-medium text-base-content truncate">
                                                        {paramFullLabel(code)}
                                                    </span>
                                                    <span className="text-xs text-base-content/60 shrink-0">
                                                        n={est.n}
                                                    </span>
                                                </div>
                                                <IntervalBarChart
                                                    hardRange={est.hardRange}
                                                    interval={est.interval}
                                                    iqr={est.iqr}
                                                    pointEstimate={est.pointEstimate}
                                                    pdk={meta?.pdk}
                                                    paramCode={code}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })}
                </>
            )}
        </BottomSheetModal>
    );
}

function sectionTitle(status: TPdkStatus | 'unmonitored'): string {
    switch (status) {
        case 'unsafe':
            return 'Срочные проблемы';
        case 'concerning':
            return 'Вероятные проблемы';
        case 'borderline':
            return 'На границе нормы';
        case 'safe':
            return 'В норме';
        case 'unmonitored':
            return 'Справочно';
    }
}
