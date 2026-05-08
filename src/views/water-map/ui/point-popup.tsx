'use client';

import { BottomSheetModal } from '@/shared/ui';
import { formatParamValue, paramFullLabel, WATER_PARAM_META } from '../lib';
import { SeverityBadge } from './severity-badge';

type TPointPopupData = {
    coords: [number, number];
    properties: Record<string, unknown>;
};

type TPointPopupProps = {
    data: TPointPopupData | null;
    onClose: () => void;
};

/**
 * Modal с деталями individual point (high-zoom). 22 параметра группируются
 * по pdkStatus аналогично predict-modal — но статус считаем локально по
 * single value (не interval). Логика:
 *   - value > pdk×2  → unsafe
 *   - value > pdk    → concerning
 *   - value > pdk×0.5 → borderline
 *   - else           → safe
 *   - pdk null       → unmonitored
 */
export function PointPopup({ data, onClose }: TPointPopupProps) {
    if (!data) {
        return (
            <BottomSheetModal isOpen={false} onClose={onClose} title="">
                {null}
            </BottomSheetModal>
        );
    }

    const props = data.properties as {
        orderNumber?: string;
        intakeType?: string;
        depthMeters?: number | null;
        sampleDate?: string;
        region?: string | null;
        locality?: string | null;
        risk?: number | null;
        params?: Record<string, number>;
    };

    const params = props.params ?? {};
    // Группировка по severity локально (single-value).
    type TBucket = 'unsafe' | 'concerning' | 'borderline' | 'safe' | 'unmonitored';
    const buckets: Record<TBucket, Array<{ code: string; value: number }>> = {
        unsafe: [],
        concerning: [],
        borderline: [],
        safe: [],
        unmonitored: [],
    };
    for (const [code, value] of Object.entries(params)) {
        const meta = WATER_PARAM_META[code as keyof typeof WATER_PARAM_META];
        const pdk = meta?.pdk;
        if (pdk === null || pdk === undefined) {
            buckets.unmonitored.push({ code, value });
            continue;
        }
        if (typeof pdk === 'number') {
            if (value > pdk * 2) buckets.unsafe.push({ code, value });
            else if (value > pdk) buckets.concerning.push({ code, value });
            else if (value > pdk * 0.5) buckets.borderline.push({ code, value });
            else buckets.safe.push({ code, value });
        } else {
            // Range pdk (ph) — внутри/снаружи диапазона
            if (value < pdk.min || value > pdk.max) buckets.concerning.push({ code, value });
            else buckets.safe.push({ code, value });
        }
    }

    const intakeRu: Record<string, string> = {
        well: 'Скважина',
        well_dug: 'Колодец',
        municipal: 'Водопровод',
        spring: 'Родник',
        other: 'Другое',
    };
    const intakeLabel = props.intakeType ? (intakeRu[props.intakeType] ?? props.intakeType) : '—';

    return (
        <BottomSheetModal
            isOpen={!!data}
            onClose={onClose}
            title={`Анализ ${props.orderNumber ?? ''}`}
            className="sm:max-w-2xl"
        >
            {/* Метаданные */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs -mt-2 pb-2 border-b border-base-content/10">
                <Meta label="Тип источника" value={intakeLabel} />
                <Meta
                    label="Глубина"
                    value={props.depthMeters != null ? `${props.depthMeters} м` : '—'}
                />
                <Meta label="Дата пробы" value={props.sampleDate ?? '—'} />
                <Meta label="Регион" value={props.locality ?? props.region ?? '—'} />
                {typeof props.risk === 'number' && (
                    <Meta label="Индекс риска" value={`${props.risk} / 100`} />
                )}
            </div>

            {(['unsafe', 'concerning', 'borderline', 'safe', 'unmonitored'] as TBucket[]).map(
                (bucket) => {
                    const items = buckets[bucket];
                    if (!items.length) return null;
                    return (
                        <details
                            key={bucket}
                            open={bucket === 'unsafe' || bucket === 'concerning'}
                            className="rounded-lg bg-base-200/40 px-3 py-2"
                        >
                            <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                                <SeverityBadge status={bucket}>
                                    {sectionTitle(bucket)} · {items.length}
                                </SeverityBadge>
                                <span className="text-base-content/40 text-xs">▾</span>
                            </summary>
                            <ul className="pt-2 space-y-1">
                                {items.map(({ code, value }) => (
                                    <li
                                        key={code}
                                        className="flex items-center justify-between gap-2 text-xs"
                                    >
                                        <span className="text-base-content/80 truncate">
                                            {paramFullLabel(code)}
                                        </span>
                                        <span className="font-medium text-base-content shrink-0 tabular-nums">
                                            {formatParamValue(code, value)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    );
                },
            )}
        </BottomSheetModal>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-2 text-xs">
            <span className="text-base-content/55">{label}</span>
            <span className="font-medium text-base-content text-right truncate">{value}</span>
        </div>
    );
}

function sectionTitle(
    bucket: 'unsafe' | 'concerning' | 'borderline' | 'safe' | 'unmonitored',
): string {
    switch (bucket) {
        case 'unsafe':
            return 'Превышение';
        case 'concerning':
            return 'Возможно проблема';
        case 'borderline':
            return 'На границе нормы';
        case 'safe':
            return 'В норме';
        case 'unmonitored':
            return 'Справочно';
    }
}
