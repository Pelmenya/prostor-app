export const REAL_ESTATE_TYPES = ['house', 'apartment', 'prom'] as const;
export type TRealEstateType = (typeof REAL_ESTATE_TYPES)[number];

export const WATER_SOURCES = ['borehole', 'well', 'reservoir', 'waterSupply'] as const;
export type TRealEstateSourceWater = (typeof WATER_SOURCES)[number];

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

export type TRetailStoreWithRouteInfo = {
    id: string;
    name: string;
    address: string;
    coordinates: TGeoJSONPoint;
    duration: number;
    distance: number;
    organizationMoySkladId?: string;
    organizationName?: string;
    availability?: 'full' | 'partial';
};

/**
 * Ответ POST /retail-stores/:id/inventory-check.
 * `available` — позиции которые есть в нужном количестве; `outOfStock` —
 * отсутствуют или есть в недостаточном. `summary` — for hero «N из M в наличии».
 */
export type TInventoryCheckItem = {
    productId: string;
    productName?: string;
    requiredCount: number;
    availableCount: number;
};

export type TInventoryCheckResponse = {
    available: TInventoryCheckItem[];
    outOfStock: TInventoryCheckItem[];
    summary: {
        availableCount: number;
        totalCount: number;
        allAvailable: boolean;
    };
};
