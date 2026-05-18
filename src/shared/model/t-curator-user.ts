import type { EUserRole } from './t-user';

export type TCuratorUser = {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
    photo_url?: string;
    phone?: string;
    email?: string;
    role: EUserRole;
    is_auth: boolean;
    email_is_confirm: boolean;
    phone_is_confirm: boolean;
    hasSeenOnboarding: boolean;
    companyId: string | null;
    created_at: string;
    updated_at: string;
};

export type TCuratorMasterAccountService = {
    id: string;
    canEdit: boolean;
    isEnabled: boolean;
    coordinates: { type: 'Point'; coordinates: [number, number] } | null;
    address: string | null;
    carNumber: string | null;
    carModel: string | null;
    storeId: string | null;
    projectId: string | null;
    grade: string | null;
};

export type TCuratorServiceUser = TCuratorUser & {
    accountService: TCuratorMasterAccountService | null;
    avgRating: number | null;
};
