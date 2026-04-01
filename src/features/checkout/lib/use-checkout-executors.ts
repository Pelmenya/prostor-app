'use client';

import { useState } from 'react';
import { sleep, expBackoff, MAX_RETRY_ATTEMPTS } from '@/shared/lib';
import { useFilteredExecutors } from '../api/executor.api';
import type { TUserWithWorkDays } from '../model/types/t-user-with-work-days';

type TExecutorsSearchStatus = 'idle' | 'loading' | 'success' | 'failed';

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

    const [executorsWithWorkDays, setExecutorsWithWorkDays] = useState<TUserWithWorkDays[]>([]);
    const [executorsSearchStatus, setExecutorsSearchStatus] =
        useState<TExecutorsSearchStatus>('idle');
    const [hasMasters, setHasMasters] = useState<boolean | null>(null);
    const [allMastersRejectedByCargo, setAllMastersRejectedByCargo] = useState(false);
    const [hasProductsWithoutDimensions, setHasProductsWithoutDimensions] = useState(false);

    const resetExecutors = () => {
        setExecutorsWithWorkDays([]);
        setExecutorsSearchStatus('idle');
        setHasMasters(null);
        setAllMastersRejectedByCargo(false);
        setHasProductsWithoutDimensions(false);
    };

    const loadExecutors = async (realEstateId: number) => {
        setExecutorsSearchStatus('loading');

        for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                const result = await fetchFilteredExecutors({
                    realEstateId,
                    serviceIds: serviceIds.length > 0 ? serviceIds : undefined,
                    productItems: productItems.length > 0 ? productItems : undefined,
                });

                setExecutorsWithWorkDays(result.executors);
                setHasMasters(result.executors.length > 0);
                setAllMastersRejectedByCargo(result.allMastersRejectedByCargo);
                setHasProductsWithoutDimensions(result.hasProductsWithoutDimensions);
                setExecutorsSearchStatus('success');
                return;
            } catch {
                if (attempt === MAX_RETRY_ATTEMPTS - 1) {
                    setExecutorsSearchStatus('failed');
                    setHasMasters(false);
                } else {
                    await sleep(expBackoff(attempt));
                }
            }
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
