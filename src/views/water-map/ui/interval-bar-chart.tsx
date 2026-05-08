import { formatParamValue } from '../lib';

type TInterval = { lower: number; upper: number };

type TIntervalBarChartProps = {
    /** Hard range — самый широкий interval (P0..P100, observed). */
    hardRange: TInterval;
    /** Primary 80% confidence (P10..P90). */
    interval: TInterval;
    /** IQR 50% confidence (P25..P75). */
    iqr: TInterval;
    /** Distance+recency-weighted median marker. */
    pointEstimate: number;
    /** ПДК — если есть, рисуется красная dashed-линия. number или {min, max} (range like ph). */
    pdk?: number | { min: number; max: number } | null;
    /** Для format value в подписях. */
    paramCode?: string;
    /** Подпись над/под — для кратких labels. */
    label?: string;
    /** Compact mode для embed в list (без axis labels). */
    compact?: boolean;
};

/**
 * Горизонтальный interval-bar chart. Три концентрических интервала + point + ПДК.
 *
 * Логика mapping value → x%:
 *   axisMin = min(hardRange.lower, pdk*0.5 if pdk number)
 *   axisMax = max(hardRange.upper, pdk*1.2 if pdk number)
 *   x% = (v - axisMin) / (axisMax - axisMin) * 100
 *
 * Для range-pdk (ph: 6-9) — рисуем 2 линии ПДК.
 *
 * Native CSS (no Recharts) — keep bundle малым. Шкалы простые, абсолютное
 * позиционирование сегментов через style.left/width.
 */
export function IntervalBarChart({
    hardRange,
    interval,
    iqr,
    pointEstimate,
    pdk,
    paramCode,
    label,
    compact,
}: TIntervalBarChartProps) {
    const pdkNumber = typeof pdk === 'number' ? pdk : null;
    const pdkMin = typeof pdk === 'object' && pdk ? pdk.min : null;
    const pdkMax = typeof pdk === 'object' && pdk ? pdk.max : null;

    // axis bounds — основываются на hardRange + ПДК (чтобы линия ПДК была в кадре).
    const candidatesMin = [hardRange.lower];
    const candidatesMax = [hardRange.upper];
    if (pdkNumber !== null) {
        candidatesMin.push(0);
        candidatesMax.push(pdkNumber * 1.2);
    }
    if (pdkMin !== null) candidatesMin.push(pdkMin * 0.95);
    if (pdkMax !== null) candidatesMax.push(pdkMax * 1.05);

    let axisMin = Math.min(...candidatesMin);
    let axisMax = Math.max(...candidatesMax);
    // Защита от degenerate range.
    if (axisMax - axisMin < 1e-9) {
        axisMax = axisMin + 1;
    }
    // Лёгкий padding по краям — чтобы крайние значения не лепились к рамке.
    const range = axisMax - axisMin;
    axisMin -= range * 0.04;
    axisMax += range * 0.04;

    const toPct = (v: number): number => {
        const r = axisMax - axisMin;
        return ((v - axisMin) / r) * 100;
    };

    const fmt = (v: number) => (paramCode ? formatParamValue(paramCode, v) : v.toFixed(2));

    return (
        <div className={compact ? 'py-1.5' : 'py-2.5'}>
            {label && !compact && <div className="text-xs text-base-content/70 mb-1">{label}</div>}
            {/* Bar контейнер */}
            <div
                className={`relative w-full ${compact ? 'h-3.5' : 'h-5'} rounded-full bg-base-200 overflow-hidden`}
            >
                {/* hardRange — самый широкий, серая subtle полоса */}
                <div
                    className="absolute top-0 h-full bg-base-content/20 rounded-full"
                    style={{
                        left: `${toPct(hardRange.lower)}%`,
                        width: `${Math.max(toPct(hardRange.upper) - toPct(hardRange.lower), 0.5)}%`,
                    }}
                />
                {/* interval primary 80% — primary color */}
                <div
                    className="absolute top-0 h-full bg-primary/55 rounded-full"
                    style={{
                        left: `${toPct(interval.lower)}%`,
                        width: `${Math.max(toPct(interval.upper) - toPct(interval.lower), 0.5)}%`,
                    }}
                />
                {/* iqr 50% — primary более saturated */}
                <div
                    className="absolute top-0 h-full bg-primary rounded-full"
                    style={{
                        left: `${toPct(iqr.lower)}%`,
                        width: `${Math.max(toPct(iqr.upper) - toPct(iqr.lower), 0.5)}%`,
                    }}
                />
                {/* pointEstimate marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-base-100 ring-2 ring-primary"
                    style={{ left: `calc(${toPct(pointEstimate)}% - 6px)` }}
                    aria-label={`Прогноз ${fmt(pointEstimate)}`}
                />
                {/* ПДК — single line или 2 lines (range) */}
                {pdkNumber !== null && pdkNumber >= axisMin && pdkNumber <= axisMax && (
                    <div
                        className="absolute top-0 h-full w-px bg-error border-l border-dashed border-error"
                        style={{ left: `${toPct(pdkNumber)}%` }}
                        aria-label={`ПДК ${fmt(pdkNumber)}`}
                    />
                )}
                {pdkMin !== null && pdkMin >= axisMin && pdkMin <= axisMax && (
                    <div
                        className="absolute top-0 h-full w-px bg-error border-l border-dashed border-error"
                        style={{ left: `${toPct(pdkMin)}%` }}
                    />
                )}
                {pdkMax !== null && pdkMax >= axisMin && pdkMax <= axisMax && (
                    <div
                        className="absolute top-0 h-full w-px bg-error border-l border-dashed border-error"
                        style={{ left: `${toPct(pdkMax)}%` }}
                    />
                )}
            </div>

            {/* Подписи под баром */}
            {!compact && (
                <div className="flex justify-between text-[10px] text-base-content/60 mt-1 leading-tight">
                    <span>{fmt(hardRange.lower)}</span>
                    <span className="font-medium text-base-content/80">~{fmt(pointEstimate)}</span>
                    <span>{fmt(hardRange.upper)}</span>
                </div>
            )}
        </div>
    );
}
