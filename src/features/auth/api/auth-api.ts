import { apiClient } from '@/shared/api';
import type { TUser } from '@/shared/model';
import type { TTelegramProfile } from '../lib/telegram-registration';

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

// ─── Telegram ────────────────────────────────────────────────
// ПРИМЕЧАНИЕ (RESEARCH A1): точные имена полей запроса/ответа (idToken vs
// id_token, registrationToken casing) не подтверждены против исходников
// бэкенда в этой сессии — локальная копия crm-aqua-kinetics-back не
// содержит /auth/telegram/* роутов (проверено при исполнении плана), а
// репозиторий не является git-чекаутом, так что нельзя определить, отстаёт
// ли он от задеплоенного бэкенда. Поля названы только здесь — расхождение
// с реальным контрактом правится однострочным diff.

export type TTelegramNonceResponse = { nonce: string };

export async function telegramNonce(): Promise<TTelegramNonceResponse> {
    return apiClient<TTelegramNonceResponse>('/auth/telegram/nonce', { method: 'POST' });
}

export type TTelegramLoginResponse =
    | TAuthResponse
    | {
          registrationRequired: true;
          registrationToken: string;
          profile: TTelegramProfile;
      };

export async function telegramLogin(idToken: string): Promise<TTelegramLoginResponse> {
    return apiClient<TTelegramLoginResponse>('/auth/telegram/login', {
        method: 'POST',
        body: { idToken },
    });
}

export async function telegramRegister(body: {
    registrationToken: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    policyVersion: string;
    pdAgreementVersion: string;
}): Promise<TAuthResponse> {
    return apiClient<TAuthResponse>('/auth/telegram/register', { method: 'POST', body });
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

export async function verifyEmail(
    token: string,
): Promise<{ success: boolean; emailChanged?: boolean }> {
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

// ─── Профиль ────────────────────────────────────────────────

export async function updateProfile(
    authHeader: string,
    body: { first_name?: string; last_name?: string; phone?: string },
): Promise<TUser> {
    return apiClient('/auth/profile', {
        method: 'PATCH',
        auth: authHeader,
        body,
    });
}

export async function changeEmail(
    authHeader: string,
    newEmail: string,
): Promise<{ success: boolean }> {
    return apiClient('/auth/change-email', {
        method: 'POST',
        auth: authHeader,
        body: { newEmail },
    });
}

/** Получить свежие данные текущего пользователя */
export async function fetchCurrentUser(accessToken: string): Promise<TUser> {
    return apiClient<TUser>('/auth/me', {
        auth: `Bearer ${accessToken}`,
    });
}
