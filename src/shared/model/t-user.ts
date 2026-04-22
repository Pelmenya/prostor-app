export enum EUserRole {
    CLIENT = 'client',
    SERVICE = 'service',
    CURATOR = 'curator',
    ADMIN = 'admin',
}

export type TUser = {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string;
    username?: string;
    photo_url?: string;
    phone?: string;
    email?: string;
    role: EUserRole;
    is_auth: boolean;
};
