'use client';

import { ArchiveBoxXMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import {
    useCartStore,
    selectTotalItems,
    selectAreAllSelected,
    selectHasSelectedItems,
    CartEmpty,
    CartItemList,
} from '@/entities/cart';
import { CartTotal } from '@/features/cart';
import { PageContainer, PageTitle, ConfirmDialog } from '@/shared/ui';

type TDialogType = 'removeSelected' | 'product' | 'service';

export function CartPage() {
    const items = useCartStore((s) => s.items);
    const toggleAllSelected = useCartStore((s) => s.toggleAllSelected);
    const removeSelected = useCartStore((s) => s.removeSelected);
    const toggleProductSelected = useCartStore((s) => s.toggleProductSelected);
    const toggleServiceSelected = useCartStore((s) => s.toggleServiceSelected);
    const updateProductCount = useCartStore((s) => s.updateProductCount);
    const updateServiceCount = useCartStore((s) => s.updateServiceCount);
    const removeProduct = useCartStore((s) => s.removeProduct);

    const cartIsFull = Object.keys(items).length > 0;
    const totalCount = selectTotalItems(items);
    const allSelected = selectAreAllSelected(items);
    const hasSelected = selectHasSelectedItems(items);

    // ConfirmDialog
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<TDialogType | null>(null);
    const [pendingProductId, setPendingProductId] = useState<string | null>(null);
    const [pendingProductName, setPendingProductName] = useState<string | null>(null);
    const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

    const resetDialog = () => {
        setDialogOpen(false);
        setDialogType(null);
        setPendingProductId(null);
        setPendingProductName(null);
        setPendingServiceId(null);
    };

    const handleRemoveProduct = (productId: string, productName: string) => {
        setPendingProductId(productId);
        setPendingProductName(productName);
        setDialogType('product');
        setDialogOpen(true);
    };

    const handleRemoveService = (productId: string, serviceId: string) => {
        setPendingProductId(productId);
        setPendingServiceId(serviceId);
        setDialogType('service');
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (dialogType === 'removeSelected') {
            removeSelected();
        } else if (dialogType === 'product' && pendingProductId) {
            removeProduct(pendingProductId);
        } else if (dialogType === 'service' && pendingProductId && pendingServiceId) {
            updateServiceCount(pendingProductId, pendingServiceId, 0);
        }
        resetDialog();
    };

    const dialogTitle =
        dialogType === 'removeSelected'
            ? 'Удалить выбранные товары?'
            : dialogType === 'product'
              ? 'Удалить товар'
              : 'Удалить услугу';

    const dialogMessage =
        dialogType === 'removeSelected'
            ? 'Вы точно хотите удалить выбранные товары? Отменить действие будет невозможно.'
            : dialogType === 'product' && pendingProductName
              ? `Вы точно хотите удалить «${pendingProductName}»? Отменить действие будет невозможно.`
              : 'Вы точно хотите удалить выбранную услугу? Отменить действие будет невозможно.';

    return (
        <PageContainer>
            <div
                className="flex flex-col gap-4 lg:gap-6"
                style={
                    hasSelected
                        ? { paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }
                        : {}
                }
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <PageTitle>Корзина</PageTitle>
                        {totalCount > 0 && (
                            <span className="badge badge-sm badge-primary">{totalCount}</span>
                        )}
                    </div>

                    {cartIsFull && (
                        <div className="flex items-center justify-between gap-6">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={allSelected}
                                    onChange={(e) => toggleAllSelected(e.target.checked)}
                                />
                                <span className="text-sm">Выбрать все</span>
                            </label>
                            <button
                                className="btn btn-outline btn-xs"
                                onClick={() => {
                                    setDialogType('removeSelected');
                                    setDialogOpen(true);
                                }}
                                disabled={!hasSelected}
                            >
                                <ArchiveBoxXMarkIcon className="size-2.75" />
                            </button>
                        </div>
                    )}
                </div>

                {cartIsFull ? (
                    <CartItemList
                        items={items}
                        onToggleProduct={toggleProductSelected}
                        onToggleService={toggleServiceSelected}
                        onUpdateProductCount={updateProductCount}
                        onUpdateServiceCount={updateServiceCount}
                        onRemoveProduct={handleRemoveProduct}
                        onRemoveService={handleRemoveService}
                    />
                ) : (
                    <CartEmpty />
                )}
            </div>

            <CartTotal />

            <ConfirmDialog
                isOpen={isDialogOpen}
                onClose={resetDialog}
                onConfirm={handleConfirm}
                title={dialogTitle}
                message={dialogMessage}
                confirmText="Удалить"
            />
        </PageContainer>
    );
}
