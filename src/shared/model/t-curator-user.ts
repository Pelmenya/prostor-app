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
