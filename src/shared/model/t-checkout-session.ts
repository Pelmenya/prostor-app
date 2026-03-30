export type TCreateCheckoutSession = {
    realEstateId?: number;
    clientComment?: string;
    deliveryType?: 'delivery' | 'pickup' | 'master_delivery';
    pickupStoreId?: string;
    deliveryCost?: number;
    sameAsServiceAddress?: boolean;
    executorId?: number;
    scheduledDate?: { date: string; timeSlot?: string };
    organizationId?: string;
    email: string;
};

export type TCheckoutSessionResponse = {
    sessionId: string;
    invoiceLink: string;
    totalAmount: number;
    expiresAt: string;
};
