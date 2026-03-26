import { apiClient } from '@/shared/api';
import type { TUser } from '@/shared/model';

export type TAuthResponse = {
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
    pdAgreementVersion: string;
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

// ─── Пароль и email ──────────────────────────────────────────

export async function changePassword(
    authHeader: string,
    body: { oldPassword: string; newPassword: string },
): Promise<{ success: boolean }> {
    return apiClient('/auth/change-password', {
        method: 'POST',
        auth: authHeader,
        body,
    });
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
    return apiClient('/auth/forgot-password', {
        method: 'POST',
        body: { email },
    });
}

export async function resetPassword(
    token: string,
    password: string,
): Promise<{ success: boolean }> {
    return apiClient('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
    });
}

export async function verifyEmail(token: string): Promise<{ success: boolean }> {
    return apiClient('/auth/verify-email', {
        method: 'POST',
        body: { token },
    });
}

export async function resendVerification(accessToken: string): Promise<{ success: boolean }> {
    return apiClient('/auth/resend-verification', {
        method: 'POST',
        auth: `Bearer ${accessToken}`,
    });
}
