import { apiClient } from '@/shared/api';
import type { TUser } from '@/shared/model';

type TAuthResponse = {
    user: TUser;
    accessToken: string;
    refreshToken: string;
};

export async function webRegister(body: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    policyVersion: string;
}): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/web/register', {
        method: 'POST',
        body,
    });
}

export async function webLogin(body: { email: string; password: string }): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/web/login', {
        method: 'POST',
        body,
    });
}

export async function webLogout(accessToken: string, refreshToken: string): Promise<void> {
    await apiClient('/auth/web/logout', {
        method: 'POST',
        auth: `Bearer ${accessToken}`,
        body: { refreshToken },
    });
}
