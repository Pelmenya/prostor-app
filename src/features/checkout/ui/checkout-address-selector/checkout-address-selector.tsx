'use client';

import { useRealEstates } from '@/entities/real-estate';
import { RealEstateCard } from '@/entities/real-estate';
import { useCheckoutStore } from '../../model/checkout.store';
import { CheckoutSection } from '../checkout-section';

type TCheckoutAddressSelectorProps = {
    onChange?: () => void;
};

export function CheckoutAddressSelector({ onChange }: TCheckoutAddressSelectorProps) {
    const { data, isLoading, error } = useRealEstates();
    const selectedRealEstateId = useCheckoutStore((s) => s.selectedRealEstateId);
    const setSelectedRealEstateId = useCheckoutStore((s) => s.setSelectedRealEstateId);

    const handleSelect = (id: number) => {
        if (selectedRealEstateId === id) {
            setSelectedRealEstateId(null);
        } else {
            setSelectedRealEstateId(id);
        }
        onChange?.();
    };

    const displayed =
        selectedRealEstateId !== null ? data?.filter((re) => re.id === selectedRealEstateId) : data;

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

    if (!displayed?.length) {
        return (
            <div className="rounded-2xl bg-base-100 p-4 text-sm text-center opacity-60">
                Нет добавленных объектов недвижимости
            </div>
        );
    }

    return (
        <CheckoutSection title="Адрес">
            {displayed.map((re) => (
                <div
                    key={re.id}
                    className={`rounded-2xl transition-all ${selectedRealEstateId === re.id ? 'ring-2 ring-primary' : ''}`}
                >
                    <RealEstateCard realEstate={re} onClick={handleSelect} />
                </div>
            ))}
        </CheckoutSection>
    );
}
