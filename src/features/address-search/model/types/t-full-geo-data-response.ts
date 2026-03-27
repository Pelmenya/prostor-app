import type { TAddressUniversalResponse } from './t-address-universal-response';
import type { TCoordinatesResData } from './t-coordinates-res-data';

export type TFullGeoDataResponse = TCoordinatesResData & {
    geoData: TAddressUniversalResponse | null;
};
