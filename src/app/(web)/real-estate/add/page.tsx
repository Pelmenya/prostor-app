import { Suspense } from 'react';
import { AddAddressPage } from '@/views/addresses';
import { PageSpinner } from '@/shared/ui';

export default function AddRealEstateRoute() {
    return (
        <Suspense fallback={<PageSpinner />}>
            <AddAddressPage />
        </Suspense>
    );
}
