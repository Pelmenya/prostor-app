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
    departureBasis?: EDepartureBasis;
};
