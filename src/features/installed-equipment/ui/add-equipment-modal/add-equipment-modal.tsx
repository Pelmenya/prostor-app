'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CompactModal, CardImage } from '@/shared/ui';
import { ApiError } from '@/shared/api';
import { extractErrorMessage } from '@/shared/lib';
import { useProductSearch, useProductThumbnails } from '@/entities/product';
import { useCreateInstalledEquipment } from '@/entities/installed-equipment';
import type { TProduct } from '@/shared/model';
import { SearchProductItem } from './search-product-item';

type TAddEquipmentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    realEstateId: number;
};

function getLocalDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Конвертирует строку YYYY-MM-DD в ISO, интерпретируя её как локальную дату (полдень) */
function localDateToISO(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

function SelectedProductPreview({
    product,
    imageUrl,
    isImageLoading,
}: {
    product: TProduct;
    imageUrl: string | undefined;
    isImageLoading: boolean;
}) {
    return (
        <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-2xl">
            <CardImage
                src={imageUrl}
                isLoading={isImageLoading}
                className="w-14 h-16 rounded-xl shrink-0"
                imgClassName="size-full object-contain"
                alt={product.name}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-sm line-clamp-2">{product.name}</span>
                {product.description && (
                    <span className="text-xs text-base-content/50 line-clamp-1">
                        {product.description}
                    </span>
                )}
            </div>
        </div>
    );
}

export function AddEquipmentModal({ isOpen, onClose, realEstateId }: TAddEquipmentModalProps) {
    const [innerQuery, setInnerQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);
    const [installedAt, setInstalledAt] = useState(getLocalDateString);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutateAsync: createEquipment, isPending } = useCreateInstalledEquipment();
    const { data: searchResults, isLoading: isSearching } = useProductSearch(debouncedQuery, {
        hasMaintenance: true,
    });

    const searchIds = searchResults?.map((p) => p.id) ?? [];
    const selectedIds = selectedProduct ? [selectedProduct.id] : [];
    const { imageUrls, loadingIds } = useProductThumbnails([...searchIds, ...selectedIds]);

    // Debounce поиска
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(innerQuery), 300);
        return () => clearTimeout(timer);
    }, [innerQuery]);

    const reset = () => {
        setInnerQuery('');
        setDebouncedQuery('');
        setSelectedProduct(null);
        setInstalledAt(getLocalDateString());
        setError(null);
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    const handleSelect = (product: TProduct) => {
        setSelectedProduct(product);
        setError(null);
    };

    const handleBack = () => {
        setSelectedProduct(null);
        setError(null);
    };

    const handleAdd = async () => {
        if (!selectedProduct) return;
        setError(null);
        try {
            await createEquipment({
                realEstateId,
                msProductId: selectedProduct.id,
                installedAt: localDateToISO(installedAt),
            });
            handleClose();
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? extractErrorMessage(err.data, 'Не удалось добавить оборудование')
                    : 'Не удалось добавить оборудование';
            setError(message);
        }
    };

    const title = selectedProduct ? 'Добавить оборудование' : 'Выберите оборудование';

    return (
        <CompactModal isOpen={isOpen} onClose={handleClose} title={title}>
            {selectedProduct ? (
                <div className="flex flex-col gap-4">
                    <SelectedProductPreview
                        product={selectedProduct}
                        imageUrl={imageUrls[selectedProduct.id]}
                        isImageLoading={loadingIds.has(selectedProduct.id)}
                    />

                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm text-base-content/60">Дата установки</span>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={installedAt}
                            max={getLocalDateString()}
                            onChange={(e) => setInstalledAt(e.target.value)}
                        />
                    </label>

                    {error && <div className="alert alert-error text-sm py-2">{error}</div>}

                    <div className="flex gap-2 mt-1">
                        <button
                            type="button"
                            className="btn btn-ghost flex-none"
                            onClick={handleBack}
                        >
                            <ArrowLeftIcon className="size-4" />
                            Назад
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary flex-1"
                            onClick={handleAdd}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                'Добавить'
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <label className="input w-full">
                        <MagnifyingGlassIcon className="size-4 shrink-0 text-base-content/40" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={innerQuery}
                            onChange={(e) => setInnerQuery(e.target.value)}
                            placeholder="Поиск фильтра, умягчителя..."
                            autoFocus
                            autoComplete="off"
                        />
                        {innerQuery && (
                            <button
                                type="button"
                                aria-label="Очистить"
                                onClick={() => {
                                    setInnerQuery('');
                                    setDebouncedQuery('');
                                    inputRef.current?.focus();
                                }}
                            >
                                <XMarkIcon className="size-4" />
                            </button>
                        )}
                    </label>

                    {isSearching && (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-md" />
                        </div>
                    )}

                    {!isSearching && searchResults && searchResults.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {searchResults.map((product) => (
                                <SearchProductItem
                                    key={product.id}
                                    product={product}
                                    imageUrl={imageUrls[product.id]}
                                    isImageLoading={loadingIds.has(product.id)}
                                    onClick={() => handleSelect(product)}
                                />
                            ))}
                        </div>
                    )}

                    {debouncedQuery.length >= 2 && !isSearching && searchResults?.length === 0 && (
                        <p className="text-center text-sm text-base-content/50 py-8">
                            Ничего не найдено
                        </p>
                    )}

                    {!debouncedQuery && (
                        <p className="text-center text-sm text-base-content/40 py-6">
                            Введите название оборудования
                        </p>
                    )}
                </div>
            )}
        </CompactModal>
    );
}
