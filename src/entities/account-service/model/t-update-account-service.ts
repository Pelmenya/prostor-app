import type { EDepartureBasis } from './e-departure-basis';
import type { EServiceGrade } from './e-service-grade';
import type { TWorkDay } from '@/shared/model';

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
    geoData?: unknown;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
    departureBasis?: EDepartureBasis;
    storeId?: string | null;
    workDays?: TWorkDay[];
    calendarMonths?: number;
};
