import type { EDepartureBasis } from './e-departure-basis';
import type { EServiceGrade } from './e-service-grade';

export type TUpdateAccountService = {
    grade?: EServiceGrade;
    carNumber?: string;
    carModel?: string;
    maxCargoLength?: number;
    maxCargoWidth?: number;
    maxCargoHeight?: number;
    maxCargoWeight?: number;
    address?: string;
    suggestion?: { machine: string; sign: string; value: string; zip: string };
    geoData?: Record<string, unknown>;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
    departureBasis?: EDepartureBasis;
    storeId?: string | null;
};
