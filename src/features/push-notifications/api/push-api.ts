import { apiClient } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/auth';

type TPushSubscriptionKeys = {
    p256dh: string;
    auth: string;
};

type TPushSubscribeBody = {
    endpoint: string;
    keys: TPushSubscriptionKeys;
    platform?: string;
};

type TPushStatusResponse = {
    isSubscribed: boolean;
};

function getAuth(): string | null {
    const token = useAuthStore.getState().accessToken;
    return token ? `Bearer ${token}` : null;
}

export async function pushSubscribe(body: TPushSubscribeBody): Promise<unknown> {
    return apiClient('/push/subscribe', {
        method: 'POST',
        body,
        auth: getAuth(),
    });
}

export async function pushUnsubscribe(endpoint: string): Promise<void> {
    await apiClient('/push/unsubscribe', {
        method: 'DELETE',
        body: { endpoint },
        auth: getAuth(),
    });
}

export async function pushStatus(): Promise<TPushStatusResponse> {
    return apiClient<TPushStatusResponse>('/push/status', { auth: getAuth() });
}

export async function pushTest(): Promise<{ sent: boolean }> {
    return apiClient<{ sent: boolean }>('/push/test', {
        method: 'POST',
        auth: getAuth(),
    });
}

export async function pushBroadcast(title: string, body: string): Promise<{ sent: number }> {
    return apiClient<{ sent: number }>('/push/broadcast', {
        method: 'POST',
        body: { title, body },
        auth: getAuth(),
    });
}
