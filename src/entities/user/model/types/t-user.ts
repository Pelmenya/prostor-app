export type TUser = {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string;
    username?: string;
    photo_url?: string;
    phone?: string;
    email?: string;
    role: string;
    is_auth: boolean;
};
