'use client';

import { BottomSheetModal } from '@/shared/ui';
import { formatParamValue, paramFullLabel, parseMaplibreObject, WATER_PARAM_META } from '../lib';
import { useEquipmentSourceStore, useWaterMapStore } from '../model';

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

type TBucket = 'unsafe' | 'concerning' | 'borderline' | 'safe' | 'unmonitored';

type TParamItem = {
    code: string;
    value: number;
    /** value / pdk для single-pdk параметров. null для range-pdk (pH) и safe. */
    ratio: number | null;
};

/**
 * Modal с деталями individual point (high-zoom анализ). После claude design
 * refresh 2026-05-14 (P0.2): hero risk-circle сверху, at-a-glance gradient bar,
 * экспандированная только unsafe секция, ×ПДК progress bar per exceeded param,
 * sticky CTA с counter фильтров.
 *
 * `pdkExceedanceRatio` берётся с бэка (slovo commit 845526d) для exceeded params.
 * At-a-glance counts считаются фронт-side (slovo handoff 2026-05-14 16:05,
 * option (а)) — frontend bucketing на основе WATER_PARAM_META.pdk.
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

    // Maplibre 5.x при доступе через e.features[0].properties в click handler
    // сериализует object/array values в JSON-string. parseMaplibreObject
    // нормализует обратно — это касается и params, и pdkExceedanceRatio.
    const props = data.properties as {
        intakeType?: string;
        depthMeters?: number | null;
        sampleDate?: string;
        region?: string | null;
        locality?: string | null;
        risk?: number | null;
        params?: Record<string, number> | string;
        pdkExceedanceRatio?: Record<string, number> | string;
    };

    const intakeLabel = (props.intakeType && INTAKE_RU[props.intakeType]) ?? 'Источник';
    const depthLabel =
        typeof props.depthMeters === 'number' && Number.isFinite(props.depthMeters)
            ? `${props.depthMeters} м`
            : null;
    const dateLabel = props.sampleDate ? formatRuDate(props.sampleDate) : null;
    const regionLabel = props.locality ?? props.region ?? null;

    const titleParts = [intakeLabel, depthLabel, dateLabel].filter(Boolean);
    const title = titleParts.length > 0 ? titleParts.join(' · ') : 'Детали анализа';

    const paramsObject = parseMaplibreObject<Record<string, number>>(props.params, {});
    const ratioObject = parseMaplibreObject<Record<string, number>>(props.pdkExceedanceRatio, {});

    const buckets: Record<TBucket, TParamItem[]> = {
        unsafe: [],
        concerning: [],
        borderline: [],
        safe: [],
        unmonitored: [],
    };

    // Локальный bucketing — frontend-side option (а) из slovo handoff 16:05.
    // backend pdkExceedanceRatio даёт **только** exceeded params (>= 1.0),
    // а тут нужны и borderline / safe / unmonitored. WATER_PARAM_META.pdk —
    // источник truth для классификации (хранится локально).
    for (const [code, raw] of Object.entries(paramsObject)) {
        if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
        const value = raw;
        const meta = WATER_PARAM_META[code as keyof typeof WATER_PARAM_META];
        const pdk = meta?.pdk;
        const backendRatio = ratioObject[code];

        if (pdk === null || pdk === undefined) {
            buckets.unmonitored.push({ code, value, ratio: null });
            continue;
        }
        if (typeof pdk === 'number') {
            const localRatio = value / pdk;
            const ratio = typeof backendRatio === 'number' ? backendRatio : localRatio;
            if (value > pdk * 2) buckets.unsafe.push({ code, value, ratio });
            else if (value > pdk) buckets.concerning.push({ code, value, ratio });
            else if (value > pdk * 0.5) buckets.borderline.push({ code, value, ratio: null });
            else buckets.safe.push({ code, value, ratio: null });
        } else {
            // Range pdk (только pH) — backend pdkExceedanceRatio для него null,
            // считается границей нормы (concerning без числовой ratio).
            if (value < pdk.min || value > pdk.max) {
                buckets.concerning.push({ code, value, ratio: null });
            } else {
                buckets.safe.push({ code, value, ratio: null });
            }
        }
    }

    // Сорт exceeded params по ratio desc (slovo handoff 16:05).
    buckets.unsafe.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
    buckets.concerning.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));

    const risk = typeof props.risk === 'number' && Number.isFinite(props.risk) ? props.risk : null;
    const problemsCount =
        buckets.unsafe.length + buckets.concerning.length + buckets.borderline.length;

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
            {/* Hero — risk-circle + at-a-glance bar. Region/locality рядом с
                кругом справа чтобы header не казался пустым на узких viewport'ах. */}
            <div className="-mt-2 pb-3 border-b border-base-content/10 flex items-center gap-4">
                <RiskHeroCircle risk={risk} />
                <div className="flex-1 min-w-0">
                    {regionLabel && (
                        <p className="text-sm text-base-content leading-tight truncate">
                            {regionLabel}
                        </p>
                    )}
                    <AtAGlanceBar
                        unsafe={buckets.unsafe.length}
                        concerning={buckets.concerning.length}
                        borderline={buckets.borderline.length}
                        safe={buckets.safe.length}
                    />
                </div>
            </div>

            {/* Unsafe — expanded by default, остальные collapsed */}
            <SeveritySection
                bucket="unsafe"
                items={buckets.unsafe}
                title="Превышение ПДК"
                defaultOpen
            />
            <SeveritySection
                bucket="concerning"
                items={buckets.concerning}
                title="Возможно проблема"
            />
            <SeveritySection
                bucket="borderline"
                items={buckets.borderline}
                title="На границе нормы"
            />
            <SeveritySection bucket="safe" items={buckets.safe} title="В норме" />

            {/* Справочно — нерегулируемые параметры (TDS реальный, ec, temperature) */}
            {buckets.unmonitored.length > 0 && (
                <details className="rounded-lg bg-base-200/20 px-3 py-2 text-base-content/60">
                    <summary className="cursor-pointer list-none text-[11px] uppercase tracking-wider font-medium">
                        Справочно · {buckets.unmonitored.length}{' '}
                        {paramTail(buckets.unmonitored.length)} без норматива ▾
                    </summary>
                    <ParamList items={buckets.unmonitored} muted />
                </details>
            )}

            {problemsCount > 0 && (
                <div className="sticky bottom-0 -mb-4 -mx-4 mt-2 px-4 pt-3 pb-4 bg-base-100 border-t border-base-content/10">
                    <button
                        type="button"
                        onClick={handleEquipment}
                        className="btn btn-primary w-full"
                    >
                        Подобрать оборудование под анализ
                    </button>
                    <p className="text-[11px] text-base-content/55 text-center mt-1.5">
                        {problemsCount} {filterTail(problemsCount)} по найденным проблемам
                    </p>
                </div>
            )}
        </BottomSheetModal>
    );
}

/**
 * Большой круг с risk 0-100 + label «риск». Цвет по severity: 81+ red,
 * 51-80 orange, 21-50 yellow, 0-20 green. Используем direct hex (matching
 * `globals.css` --wm-severity-*) — Tailwind arbitrary value через
 * `[color:...]` ломается на SVG fill в Tailwind 4. Шкала идентичная
 * cell-popup risk-circle, но визуально крупнее (4xl vs xl).
 */
function RiskHeroCircle({ risk }: { risk: number | null }) {
    if (risk === null) {
        return (
            <div className="shrink-0 size-20 rounded-full bg-base-200 flex flex-col items-center justify-center">
                <span className="text-xs text-base-content/40">риск</span>
                <span className="text-xl font-bold text-base-content/40">—</span>
            </div>
        );
    }
    const { color, ringColor } = riskColors(risk);
    return (
        <div
            className="shrink-0 size-20 rounded-full flex flex-col items-center justify-center"
            style={{
                backgroundColor: `${color}15`,
                outline: `2px solid ${ringColor}`,
                outlineOffset: '-2px',
            }}
        >
            <span className="text-[10px] text-base-content/60 uppercase tracking-wider leading-none">
                риск
            </span>
            <span className="text-2xl font-bold leading-none mt-0.5" style={{ color }}>
                {risk}
            </span>
            <span className="text-[9px] text-base-content/40 leading-none mt-0.5">из 100</span>
        </div>
    );
}

function riskColors(risk: number): { color: string; ringColor: string } {
    if (risk >= 81) return { color: '#dc4c3e', ringColor: '#dc4c3e' };
    if (risk >= 51) return { color: '#e58146', ringColor: '#e58146' };
    if (risk >= 21) return { color: '#d6c44a', ringColor: '#d6c44a' };
    return { color: '#34c879', ringColor: '#34c879' };
}

/**
 * Stacked gradient bar — пропорции 4 severity bucket'ов. Под bar'ом —
 * compact label «4 ПДК · 3 возм · 1 гран · 6 норма», нулевые сегменты
 * скипаются (визуальный шум). Если все нули — fallback «параметры не
 * измерены».
 */
function AtAGlanceBar({
    unsafe,
    concerning,
    borderline,
    safe,
}: {
    unsafe: number;
    concerning: number;
    borderline: number;
    safe: number;
}) {
    const total = unsafe + concerning + borderline + safe;
    if (total === 0) {
        return <p className="text-xs text-base-content/55 mt-1">Параметры не измерены</p>;
    }
    const seg = (count: number, color: string, label: string) =>
        count > 0 ? { count, color, label, pct: (count / total) * 100 } : null;
    const segments = [
        seg(unsafe, '#dc4c3e', 'ПДК'),
        seg(concerning, '#e58146', 'возм'),
        seg(borderline, '#d6c44a', 'гран'),
        seg(safe, '#34c879', 'норма'),
    ].filter((s): s is { count: number; color: string; label: string; pct: number } => s !== null);

    return (
        <div className="mt-1.5">
            <div className="flex h-2 rounded-full overflow-hidden bg-base-200">
                {segments.map((s) => (
                    <div
                        key={s.label}
                        style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                        title={`${s.count} ${s.label}`}
                    />
                ))}
            </div>
            <p className="text-[11px] text-base-content/60 mt-1 leading-snug">
                {segments.map((s, idx) => (
                    <span key={s.label}>
                        <b style={{ color: s.color }}>{s.count}</b>
                        <span className="ml-0.5">{s.label}</span>
                        {idx < segments.length - 1 ? <span className="mx-1">·</span> : ''}
                    </span>
                ))}
            </p>
        </div>
    );
}

function SeveritySection({
    bucket,
    items,
    title,
    defaultOpen = false,
}: {
    bucket: TBucket;
    items: TParamItem[];
    title: string;
    defaultOpen?: boolean;
}) {
    if (!items.length) return null;
    const { dotColor, textColor } = bucketColors(bucket);
    return (
        <details
            open={defaultOpen}
            className="rounded-lg bg-base-200/40 px-3 py-2 group [&_summary::-webkit-details-marker]:hidden"
        >
            <summary className="flex items-center justify-between cursor-pointer list-none gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} />
                    <span style={{ color: textColor }}>{title}</span>
                    <span className="text-base-content/55">· {items.length}</span>
                </span>
                <span className="text-base-content/40 text-xs group-open:rotate-180 transition-transform">
                    ▾
                </span>
            </summary>
            <ParamList items={items} showRatio={bucket === 'unsafe' || bucket === 'concerning'} />
        </details>
    );
}

function bucketColors(bucket: TBucket): { dotColor: string; textColor: string } {
    switch (bucket) {
        case 'unsafe':
            return { dotColor: '#dc4c3e', textColor: '#b73d31' };
        case 'concerning':
            return { dotColor: '#e58146', textColor: '#b86838' };
        case 'borderline':
            return { dotColor: '#d6c44a', textColor: '#9a8c2f' };
        case 'safe':
            return { dotColor: '#34c879', textColor: '#1e8f57' };
        case 'unmonitored':
            return { dotColor: '#9ca3af', textColor: '#6b7280' };
    }
}

/**
 * ParamRow: название + value справа. Для exceeded (showRatio=true) добавляем
 * вторую строку с «×N.N ПДК» + красный progress bar. Progress fill
 * пропорционален ratio с clamp 10× (всё что выше — full bar) — иначе при
 * Mn=×30 ПДК визуально те же 100% что и при ×10, и юзер не отличит.
 */
function ParamList({
    items,
    muted,
    showRatio,
}: {
    items: TParamItem[];
    muted?: boolean;
    showRatio?: boolean;
}) {
    return (
        <ul className="pt-2 space-y-2">
            {items.map(({ code, value, ratio }) => (
                <li key={code} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
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
                    </div>
                    {showRatio && ratio !== null && ratio >= 1 && (
                        <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-base-300 overflow-hidden">
                                <div
                                    className="h-full bg-error"
                                    style={{ width: `${Math.min(ratio / 10, 1) * 100}%` }}
                                />
                            </div>
                            <span className="text-error font-medium tabular-nums shrink-0">
                                ×{ratio.toFixed(1)} ПДК
                            </span>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

function filterTail(n: number): string {
    if (n === 1) return 'фильтр';
    if (n >= 2 && n <= 4) return 'фильтра';
    return 'фильтров';
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
