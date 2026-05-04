import type { TUser, TWorkDay } from '@/shared/model';

export type TUserWithWorkDays = {
    user: TUser;
    workDays: TWorkDay[];
};
