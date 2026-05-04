import type { EDepartureBasis } from './e-departure-basis';
import type { EServiceGrade } from './e-service-grade';
import type { TServiceSetup } from './t-service-setup';
import type { TWorkDay } from '@/shared/model';

export type TAccountService = {
    id: string | null;
    address: string | null;
    carNumber: string | null;
    carModel: string | null;
    storeId: string | null;
    msEmployeeId: string | null;
    canEdit: boolean | null;
    isEnabled: boolean | null;
    grade: EServiceGrade | null;
    maxCargoLength: number | null;
    maxCargoWidth: number | null;
    maxCargoHeight: number | null;
    maxCargoWeight: number | null;
    departureBasis: EDepartureBasis | null;
    acceptedOfferVersion: string | null;
    offerAcceptedAt: string | null;
    needsOfferReaccept: boolean | null;
    serviceSetup: TServiceSetup | null;
    coordinates: { type: 'Point'; coordinates: [number, number] } | null;
    workDays: TWorkDay[] | null;
    calendarMonths: number | null;
};
