'use client';

import { useState, useRef } from 'react';
import { retryAsync } from '@/shared/lib';
import { useFilteredExecutors } from '../api/executor.api';
import type { TUserWithWorkDays } from '../model/types/t-user-with-work-days';

export type TExecutorsSearchStatus = 'idle' | 'loading' | 'success' | 'failed';

type TUseCheckoutExecutorsParams = {
    serviceIds: string[];
    productItems: { productId: string; count: number }[];
};

type TUseCheckoutExecutorsReturn = {
    executorsWithWorkDays: TUserWithWorkDays[];
    executorsSearchStatus: TExecutorsSearchStatus;
    hasMasters: boolean | null;
    allMastersRejectedByCargo: boolean;
    hasProductsWithoutDimensions: boolean;
    loadExecutors: (realEstateId: number) => Promise<void>;
    resetExecutors: () => void;
};

export function useCheckoutExecutors({
    serviceIds,
    productItems,
}: TUseCheckoutExecutorsParams): TUseCheckoutExecutorsReturn {
    const { mutateAsync: fetchFilteredExecutors } = useFilteredExecutors();
    // requestIdRef предотвращает race condition при быстрой смене адреса
    const requestIdRef = useRef(0);

    const [executorsWithWorkDays, setExecutorsWithWorkDays] = useState<TUserWithWorkDays[]>([]);
    const [executorsSearchStatus, setExecutorsSearchStatus] =
        useState<TExecutorsSearchStatus>('idle');
    const [allMastersRejectedByCargo, setAllMastersRejectedByCargo] = useState(false);
    const [hasProductsWithoutDimensions, setHasProductsWithoutDimensions] = useState(false);

    // Вычисляемое значение — отдельный стейт не нужен
    const hasMasters =
        executorsSearchStatus === 'idle' || executorsSearchStatus === 'loading'
            ? null
            : executorsWithWorkDays.length > 0;

    const resetExecutors = () => {
        setExecutorsWithWorkDays([]);
        setExecutorsSearchStatus('idle');
        setAllMastersRejectedByCargo(false);
        setHasProductsWithoutDimensions(false);
    };

    const loadExecutors = async (realEstateId: number) => {
        const currentRequestId = ++requestIdRef.current;
        setExecutorsSearchStatus('loading');

        try {
            const result = await retryAsync(() =>
                fetchFilteredExecutors({
                    realEstateId,
                    serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
                    productItems: productItems.length > 0 ? productItems : undefined,
                }),
            );

            // Игнорируем устаревший ответ — адрес успел смениться
            if (requestIdRef.current !== currentRequestId) return;

            setExecutorsWithWorkDays(result.executors);
            setAllMastersRejectedByCargo(result.allMastersRejectedByCargo);
            setHasProductsWithoutDimensions(result.hasProductsWithoutDimensions);
            setExecutorsSearchStatus('success');
        } catch {
            if (requestIdRef.current !== currentRequestId) return;
            setExecutorsSearchStatus('failed');
        }
    };

    return {
        executorsWithWorkDays,
        executorsSearchStatus,
        hasMasters,
        allMastersRejectedByCargo,
        hasProductsWithoutDimensions,
        loadExecutors,
        resetExecutors,
    };
}
