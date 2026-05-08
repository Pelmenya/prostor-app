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
