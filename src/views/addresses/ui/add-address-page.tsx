'use client';

import { useRouter } from 'next/navigation';
import { RealEstateWizard } from '@/features/real-estate';

export function AddAddressPage() {
    const router = useRouter();

    return <RealEstateWizard onSuccess={() => router.push('/profile/addresses')} />;
}
