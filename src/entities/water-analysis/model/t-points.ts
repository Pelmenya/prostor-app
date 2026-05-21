export type TPointProperties = {
    /** order_number из бланка анализа. */
    orderNumber: string;
    intakeType: string;
    depthMeters: number | null;
    sampleDate: string;
    region: string | null;
    locality: string | null;
    /** paramCode → значение в канонической единице. */
    params: Record<string, number>;
    risk: number | null;
    /**
     * Только exceeded params: `value / pdk` для single-pdk параметров, округлено
     * до 1 знака. Safe / range-pdk (pH) / non-regulated (temperature, conductivity)
     * — отсутствуют в объекте. Пустой `{}` если нет превышений или нечего считать.
     *
     * Источник: slovo commit 845526d (handoff 2026-05-14 16:05).
     */
    pdkExceedanceRatio?: Record<string, number>;
};

export type TPointFeature = {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: TPointProperties;
};

export type TPointsResponse = {
    type: 'FeatureCollection';
    features: TPointFeature[];
    count: number;
    truncated: boolean;
    limit: number;
    timeTakenMs: number;
    cached: boolean;
};
