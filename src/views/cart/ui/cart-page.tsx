'use client';

import { ArchiveBoxXMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import {
    useCartStore,
    selectTotalItems,
    selectAreAllSelected,
    selectHasSelectedItems,
    CartEmpty,
} from '@/entities/cart';
import { PageContainer, PageTitle, ConfirmDialog } from '@/shared/ui';

export function CartPage() {
    const items = useCartStore((s) => s.items);
    const toggleAllSelected = useCartStore((s) => s.toggleAllSelected);
    const removeSelected = useCartStore((s) => s.removeSelected);

    const cartIsFull = Object.keys(items).length > 0;
    const totalCount = selectTotalItems(items);
    const allSelected = selectAreAllSelected(items);
    const hasSelected = selectHasSelectedItems(items);

    const [isDialogOpen, setDialogOpen] = useState(false);

    const handleRemoveSelected = () => {
        removeSelected();
        setDialogOpen(false);
    };

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
                                onClick={() => setDialogOpen(true)}
                                disabled={!hasSelected}
                            >
                                <ArchiveBoxXMarkIcon className="size-[11px]" />
                            </button>
                        </div>
                    )}
                </div>

                {cartIsFull ? (
                    <div className="flex flex-col gap-4">
                        {/* CartItemList будет здесь */}
                        <p className="text-center text-sm text-base-content/50">
                            Список товаров (следующий этап)
                        </p>
                    </div>
                ) : (
                    <CartEmpty />
                )}
            </div>

            {/* CartTotal будет здесь */}

            <ConfirmDialog
                isOpen={isDialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={handleRemoveSelected}
                title="Удалить выбранные товары?"
                message="Вы точно хотите удалить выбранные товары? Отменить действие будет невозможно."
                confirmText="Удалить"
            />
        </PageContainer>
    );
}
