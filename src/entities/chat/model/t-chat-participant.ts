import type { EUserRole } from '@/shared/model';

export type TChatParticipant = {
    id: number;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    role: EUserRole;
};
