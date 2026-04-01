'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
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
            <CheckoutSection title="Адрес">
                <div className="rounded-2xl bg-base-100 p-4 flex flex-col items-center gap-3 text-sm text-center">
                    <p className="opacity-60">Нет добавленных адресов</p>
                    <Link
                        href="/real-estate/add?returnTo=/checkout"
                        className="btn btn-primary btn-sm"
                    >
                        <PlusCircleIcon className="size-4" />
                        Добавить адрес
                    </Link>
                </div>
            </CheckoutSection>
        );
    }

    return (
        <>
            <CheckoutSection title="Адрес">
                {selectedRealEstate ? (
                    <div
                        className="rounded-2xl ring-2 ring-primary transition-opacity active:opacity-70 cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <RealEstateCard realEstate={selectedRealEstate} showEditIcon />
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
                    <Link
                        href="/real-estate/add?returnTo=/checkout"
                        className="btn btn-outline btn-sm w-full mt-1"
                    >
                        <PlusCircleIcon className="size-4" />
                        Добавить новый адрес
                    </Link>
                </div>
            </CompactModal>
        </>
    );
}
