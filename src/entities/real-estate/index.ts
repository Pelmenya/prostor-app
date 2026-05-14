export {
    realEstateKeys,
    useRealEstates,
    useRealEstate,
    useCreateRealEstate,
    useUpdateRealEstate,
    useDeleteRealEstate,
    useNearestRetailStores,
    useNearestRetailStoresByCoords,
    useRoutePolyline,
    useRoutePolylineByCoords,
    useInventoryCheck,
} from './api/real-estate.api';
export type { TRoutePolylineResponse } from './api/real-estate.api';

export { RealEstateCard } from './ui/real-estate-card/real-estate-card';

export { getRealEstateTypeName, TYPE_NAMES } from './lib/get-real-estate-type-name';
export { getWaterSourceName, SOURCE_NAMES } from './lib/get-water-source-name';
export { getWaterIntakePointName, POINT_NAMES } from './lib/get-water-intake-point-name';
export { TYPE_ICONS } from './lib/real-estate-type-icons';
