'use client';

import { useRouter } from 'next/navigation';
import { RealEstateWizard } from '@/features/real-estate';
import { PageContainer, PageTitle } from '@/shared/ui';

export function AddAddressPage() {
    const router = useRouter();

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <PageTitle>Новый объект</PageTitle>
                <RealEstateWizard onSuccess={() => router.push('/profile/addresses')} />
            </div>
        </PageContainer>
    );
}
