import { apiClient } from '@/shared/api';

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

export async function pushSubscribe(body: TPushSubscribeBody, auth: string): Promise<unknown> {
    return apiClient('/push/subscribe', {
        method: 'POST',
        body,
        auth,
    });
}

export async function pushUnsubscribe(endpoint: string, auth: string): Promise<void> {
    await apiClient('/push/unsubscribe', {
        method: 'DELETE',
        body: { endpoint },
        auth,
    });
}

export async function pushStatus(auth: string): Promise<TPushStatusResponse> {
    return apiClient<TPushStatusResponse>('/push/status', { auth });
}

export async function pushTest(auth: string): Promise<{ sent: boolean }> {
    return apiClient<{ sent: boolean }>('/push/test', {
        method: 'POST',
        auth,
    });
}
