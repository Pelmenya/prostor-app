import type { TUser } from '@/shared/model';
import type { TWorkDay } from '@/shared/model';

export type TUserWithWorkDays = {
    user: TUser;
    workDays: TWorkDay[];
};
