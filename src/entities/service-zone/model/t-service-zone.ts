export type TServiceZone = {
    id: number;
    name: string;
    color: string;
    coordinates?: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
    isActive: boolean;
    masterCount: number;
    maxMasters: number | null;
    source?: string;
    osmId?: number | null;
    createdAt: string;
    updatedAt: string;
};
