'use client';

import { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useRealEstates } from '@/entities/real-estate';
import { RealEstateCard } from '@/entities/real-estate';
import { CompactModal } from '@/shared/ui';
import { useCheckoutStore } from '../../model/checkout.store';
import { CheckoutSection } from '../checkout-section';

type TCheckoutAddressSelectorProps = {
    onChange?: () => void;
};

export function CheckoutAddressSelector({ onChange }: TCheckoutAddressSelectorProps) {
    const { data, isLoading, error } = useRealEstates();
    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const setSelectedRealEstateId = useCheckoutStore((s) => s.setSelectedRealEstateId);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedRealEstate = data?.find((re) => re.id === selectedRealEstateId) ?? null;

    const handleSelect = (id: number) => {
        setSelectedRealEstateId(id);
        setIsModalOpen(false);
        onChange?.();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-26.5 w-full rounded-2xl" />
            </div>
        );
    }

    if (error) {
        return <p className="text-error text-sm">Не удалось загрузить адреса</p>;
    }

    if (!data?.length) {
        return (
            <div className="rounded-2xl bg-base-100 p-4 text-sm text-center opacity-60">
                Нет добавленных объектов недвижимости
            </div>
        );
    }

    return (
        <>
            <CheckoutSection title="Адрес">
                {selectedRealEstate ? (
                    <div
                        className={`relative rounded-2xl ring-2 ring-primary transition-opacity active:opacity-70 ${data.length > 1 ? 'cursor-pointer' : ''}`}
                        onClick={data.length > 1 ? () => setIsModalOpen(true) : undefined}
                    >
                        <RealEstateCard realEstate={selectedRealEstate} />
                        {data.length > 1 && (
                            <PencilSquareIcon className="absolute top-4 right-4 size-6 pointer-events-none" />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {data.map((re) => (
                            <RealEstateCard key={re.id} realEstate={re} onClick={handleSelect} />
                        ))}
                    </div>
                )}
            </CheckoutSection>

            <CompactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Выберите адрес"
            >
                <div className="flex flex-col gap-2">
                    {data.map((re) => (
                        <div
                            key={re.id}
                            className={`rounded-2xl transition-all ${selectedRealEstateId === re.id ? 'ring-2 ring-primary' : ''}`}
                        >
                            <RealEstateCard realEstate={re} onClick={handleSelect} />
                        </div>
                    ))}
                </div>
            </CompactModal>
        </>
    );
}
