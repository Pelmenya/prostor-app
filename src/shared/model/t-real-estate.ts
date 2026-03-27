export type TRealEstateType = 'house' | 'apartment' | 'prom';
export type TRealEstateSourceWater = 'borehole' | 'well' | 'reservoir' | 'waterSupply';

export type TWaterIntakePoints = {
    toilet: number;
    sink: number;
    bath: number;
    washingMachine: number;
    dishWasher: number;
    showerCabin: number;
};

export type TGeoJSONPoint = {
    type: 'Point';
    coordinates: [number, number];
};

export type TRealEstate = {
    id: number;
    address: string;
    geoData: Record<string, unknown> | null;
    suggestion: Record<string, unknown> | null;
    coordinates: TGeoJSONPoint | null;
    activeType: TRealEstateType;
    residents: number;
    activeSource: TRealEstateSourceWater;
    depthWaterSource?: number;
    waterIntakePoints: TWaterIntakePoints;
    created_at: string;
    updated_at: string;
};

export type TCreateRealEstate = {
    address?: string;
    geoData?: Record<string, unknown>;
    suggestion?: Record<string, unknown>;
    coordinates?: TGeoJSONPoint | null;
    activeType: TRealEstateType;
    residents: number;
    activeSource: TRealEstateSourceWater;
    depthWaterSource?: number;
    waterIntakePoints: TWaterIntakePoints;
};

export type TUpdateRealEstate = Partial<TCreateRealEstate>;
