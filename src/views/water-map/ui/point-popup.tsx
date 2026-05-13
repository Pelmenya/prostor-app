'use client';

import type { ReactNode } from 'react';
import { BottomSheetModal } from '@/shared/ui';
import { formatParamValue, paramFullLabel, parseMaplibreObject, WATER_PARAM_META } from '../lib';
import { useEquipmentSourceStore, useWaterMapStore } from '../model';
import { SeverityBadge } from './severity-badge';

type TPointPopupData = {
    coords: [number, number];
    properties: Record<string, unknown>;
};

type TPointPopupProps = {
    data: TPointPopupData | null;
    onClose: () => void;
};

const INTAKE_RU: Record<string, string> = {
    well: 'Скважина',
    well_dug: 'Колодец',
    municipal: 'Водопровод',
    spring: 'Родник',
    other: 'Другой источник',
};

/**
 * Modal с деталями individual point (high-zoom анализ). Контекст-богатый
 * header: тип источника + глубина + дата + регион, плюс risk-score badge.
 *
 * 22 параметра группируются локально по severity (single-value compare с ПДК).
 * Non-number values пропускаются — не показываем прочерки в bucket'ах.
 * Unmonitored секция collapsed по умолчанию (не загромождает основной view).
 */
export function PointPopup({ data, onClose }: TPointPopupProps) {
    const setEquipmentOpen = useWaterMapStore((s) => s.setEquipmentOpen);
    const setEquipmentSource = useEquipmentSourceStore((s) => s.setSource);

    if (!data) {
        return (
            <BottomSheetModal isOpen={false} onClose={onClose} title="">
                {null}
            </BottomSheetModal>
        );
    }

    // Backend (slovo-claude 2026-05-13 19:00) шлёт `params` как plain object
    // Record<paramCode, number>. НО maplibre-gl-js при доступе через
    // `e.features[0].properties` в click handler сериализует object/array
    // values в JSON-string (known quirk, аналогично aquiferLayers в DepthPopup).
    // Поэтому params на входе — `Record | string`, нормализуем через JSON.parse.
    const props = data.properties as {
        intakeType?: string;
        depthMeters?: number | null;
        sampleDate?: string;
        region?: string | null;
        locality?: string | null;
        risk?: number | null;
        params?: Record<string, number> | string;
    };

    const intakeLabel = (props.intakeType && INTAKE_RU[props.intakeType]) ?? 'Источник';
    const depthLabel =
        typeof props.depthMeters === 'number' && Number.isFinite(props.depthMeters)
            ? `${props.depthMeters} м`
            : null;
    const dateLabel = props.sampleDate ? formatRuDate(props.sampleDate) : null;
    const regionLabel = props.locality ?? props.region ?? null;

    // Title — короткий описательный, без удалённого orderNumber.
    const titleParts = [intakeLabel, depthLabel, dateLabel].filter(Boolean);
    const title = titleParts.length > 0 ? titleParts.join(' · ') : 'Детали анализа';

    type TBucket = 'unsafe' | 'concerning' | 'borderline' | 'safe' | 'unmonitored';
    const buckets: Record<TBucket, Array<{ code: string; value: number }>> = {
        unsafe: [],
        concerning: [],
        borderline: [],
        safe: [],
        unmonitored: [],
    };

    // Maplibre quirk: object properties в click event сериализуются в string.
    // parseMaplibreObject нормализует обратно. См. lib/maplibre-quirks.ts.
    const paramsObject = parseMaplibreObject<Record<string, number>>(props.params, {});

    for (const [code, raw] of Object.entries(paramsObject)) {
        // Skip non-number values (защита от backend edge cases).
        if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
        const value = raw;
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
            // Range pdk (pH)
            if (value < pdk.min || value > pdk.max) buckets.concerning.push({ code, value });
            else buckets.safe.push({ code, value });
        }
    }

    const problemsCount =
        buckets.unsafe.length + buckets.concerning.length + buckets.borderline.length;
    const safeCount = buckets.safe.length;

    const handleEquipment = () => {
        setEquipmentSource({
            lat: data.coords[0],
            lon: data.coords[1],
            source: 'cell',
        });
        onClose();
        setEquipmentOpen(true);
    };

    return (
        <BottomSheetModal isOpen={!!data} onClose={onClose} title={title} className="sm:max-w-2xl">
            {/* Контекст анализа */}
            <div className="-mt-2 pb-2 border-b border-base-content/10 space-y-1">
                {regionLabel && (
                    <p className="text-sm text-base-content leading-tight">{regionLabel}</p>
                )}
                <p className="text-[11px] text-base-content/55 leading-snug">
                    <Summary
                        problemsCount={problemsCount}
                        safeCount={safeCount}
                        risk={
                            typeof props.risk === 'number' && Number.isFinite(props.risk)
                                ? props.risk
                                : null
                        }
                    />
                </p>
            </div>

            {/* Bucket-секции — только проблемные раскрыты, в норме/справочно collapsed */}
            {(['unsafe', 'concerning', 'borderline'] as TBucket[]).map((bucket) => {
                const items = buckets[bucket];
                if (!items.length) return null;
                return (
                    <details key={bucket} open className="rounded-lg bg-base-200/40 px-3 py-2">
                        <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                            <SeverityBadge status={bucket}>
                                {sectionTitle(bucket)} · {items.length}
                            </SeverityBadge>
                            <span className="text-base-content/40 text-xs">▾</span>
                        </summary>
                        <ParamList items={items} />
                    </details>
                );
            })}

            {/* В норме — collapsed */}
            {buckets.safe.length > 0 && (
                <details className="rounded-lg bg-base-200/40 px-3 py-2">
                    <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                        <SeverityBadge status="safe">В норме · {buckets.safe.length}</SeverityBadge>
                        <span className="text-base-content/40 text-xs">▾</span>
                    </summary>
                    <ParamList items={buckets.safe} />
                </details>
            )}

            {/* Справочно — только если есть данные, collapsed by default,
                в muted-стиле чтобы не доминировал визуально */}
            {buckets.unmonitored.length > 0 && (
                <details className="rounded-lg bg-base-200/20 px-3 py-2 text-base-content/60">
                    <summary className="cursor-pointer list-none text-[11px] uppercase tracking-wider font-medium">
                        Справочно · {buckets.unmonitored.length}{' '}
                        {paramTail(buckets.unmonitored.length)} без норматива ▾
                    </summary>
                    <ParamList items={buckets.unmonitored} muted />
                </details>
            )}

            {/* CTA — подбор оборудования если есть проблемы */}
            {problemsCount > 0 && (
                <div className="sticky bottom-0 -mb-4 -mx-4 mt-2 px-4 pt-3 pb-4 bg-base-100 border-t border-base-content/10">
                    <button
                        type="button"
                        onClick={handleEquipment}
                        className="btn btn-primary w-full"
                    >
                        Подобрать оборудование под анализ
                    </button>
                </div>
            )}
        </BottomSheetModal>
    );
}

/**
 * Header-сводка: «N проблем · M в норме · риск X/100». Skipаем нулевые
 * counters чтобы избежать UX-шума «0 в норме» (юзеру непонятно что
 * значит). Если нет ни одного измеренного параметра — fallback-надпись.
 */
function Summary({
    problemsCount,
    safeCount,
    risk,
}: {
    problemsCount: number;
    safeCount: number;
    risk: number | null;
}) {
    const parts: ReactNode[] = [];

    if (problemsCount > 0) {
        parts.push(
            <span key="prob">
                <b className="text-error">{problemsCount}</b> {problemTail(problemsCount)}
            </span>,
        );
    }
    if (safeCount > 0) {
        parts.push(
            <span key="safe">
                <b className="text-success">{safeCount}</b> в норме
            </span>,
        );
    }
    if (risk !== null) {
        const riskCls = risk > 80 ? 'text-error' : risk > 50 ? 'text-warning' : 'text-success';
        parts.push(
            <span key="risk">
                риск <b className={riskCls}>{risk}/100</b>
            </span>,
        );
    }

    if (parts.length === 0) {
        return <span>Параметры не измерены</span>;
    }

    // Расставляем разделители « · » между частями
    return (
        <>
            {parts.map((part, idx) => (
                <span key={idx}>
                    {part}
                    {idx < parts.length - 1 ? ' · ' : ''}
                </span>
            ))}
        </>
    );
}

function ParamList({
    items,
    muted,
}: {
    items: Array<{ code: string; value: number }>;
    muted?: boolean;
}) {
    return (
        <ul className="pt-2 space-y-1">
            {items.map(({ code, value }) => (
                <li key={code} className="flex items-center justify-between gap-2 text-xs">
                    <span
                        className={`truncate ${muted ? 'text-base-content/55' : 'text-base-content/80'}`}
                    >
                        {paramFullLabel(code)}
                    </span>
                    <span
                        className={`font-medium shrink-0 tabular-nums ${muted ? 'text-base-content/60' : 'text-base-content'}`}
                    >
                        {formatParamValue(code, value)}
                    </span>
                </li>
            ))}
        </ul>
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

function problemTail(n: number): string {
    if (n === 1) return 'проблема';
    if (n >= 2 && n <= 4) return 'проблемы';
    return 'проблем';
}

function paramTail(n: number): string {
    if (n === 1) return 'параметр';
    if (n >= 2 && n <= 4) return 'параметра';
    return 'параметров';
}

function formatRuDate(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return `${m[3]}.${m[2]}.${m[1]}`;
}
