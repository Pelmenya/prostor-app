'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useCreateOrder, EDeliveryType } from '@/entities/order';
import { useCart, CART_QUERY_KEY } from '@/entities/cart';
import { useAuth } from '@/shared/lib/platform';
import { useCheckoutStore } from '../model/checkout.store';
import type { TUserWithWorkDays } from '../model/types/t-user-with-work-days';
import type { TWorkDay } from '@/entities/order';

const emailSchema = z.string().email();

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const expBackoff = (attempt: number) => Math.min(400 * Math.pow(2, attempt), 3000);
const MAX_ATTEMPTS = 3;

type TUseCheckoutSubmitParams = {
    deliveryType: EDeliveryType | undefined;
    hasProducts: boolean;
    activeTab: 'pickup' | 'master_delivery' | 'transport_company';
    selectedExecutor: TUserWithWorkDays | null;
    desiredIntervalDate: [TWorkDay, TWorkDay] | null;
    clientComment: string;
    receiptEmail: string;
};

export function isEmailValid(email: string): boolean {
    return emailSchema.safeParse(email).success;
}

export function useCheckoutSubmit({
    deliveryType,
    hasProducts,
    activeTab,
    selectedExecutor,
    desiredIntervalDate,
    clientComment,
    receiptEmail,
}: TUseCheckoutSubmitParams) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: cartData } = useCart();
    const { mutateAsync: createOrder } = useCreateOrder();
    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const selectedPickupStore = useCheckoutStore((s) => s.selectedPickupStore);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const submittingLockRef = useRef(false);

    const handleSubmit = async () => {
        if (submittingLockRef.current || isSubmitting) return;
        if (!user || !selectedRealEstateId) return;

        submittingLockRef.current = true;
        setIsSubmitting(true);
        setOrderError(null);

        const cartId = cartData?.id;
        if (!cartId) {
            setOrderError('Корзина не синхронизирована. Попробуйте ещё раз.');
            submittingLockRef.current = false;
            setIsSubmitting(false);
            return;
        }

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                const order = await createOrder({
                    clientId: user.id,
                    realEstateId: selectedRealEstateId,
                    cartId,
                    deliveryType,
                    pickupStoreId:
                        hasProducts && activeTab === 'pickup' ? selectedPickupStore?.id : undefined,
                    organizationId:
                        hasProducts && activeTab === 'pickup'
                            ? selectedPickupStore?.organizationMoySkladId
                            : undefined,
                    executorId: selectedExecutor?.user?.id,
                    scheduledDate: selectedExecutor?.workDays?.[0],
                    desiredIntervalDate: desiredIntervalDate ?? undefined,
                    clientComment: clientComment || undefined,
                    email: receiptEmail || undefined,
                });

                await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
                router.replace(`/orders/${order.id}`);
                return;
            } catch (err) {
                if (attempt === MAX_ATTEMPTS - 1) {
                    console.error('[checkout] handleSubmit error:', err);
                    setOrderError(
                        'Ошибка при оформлении. Проверьте соединение и попробуйте ещё раз.',
                    );
                } else {
                    await sleep(expBackoff(attempt));
                }
            }
        }

        submittingLockRef.current = false;
        setIsSubmitting(false);
    };

    return { isSubmitting, orderError, handleSubmit };
}
