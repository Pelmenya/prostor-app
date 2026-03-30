import type { TUser } from '@/shared/model';
import type { TWorkDay } from '@/entities/order';

export type TUserWithWorkDays = {
    user: TUser;
    workDays: TWorkDay[];
};
