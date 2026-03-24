'use client';

import { ArchiveBoxXMarkIcon } from '@heroicons/react/20/solid';

import {
    useCartStore,
    selectTotalItems,
    selectAreAllSelected,
    selectHasSelectedItems,
    CartEmpty,
    CartItemList,
} from '@/entities/cart';
import { CartTotal, useCartImages, useCartConfirmDialog } from '@/features/cart';
import { PageContainer, PageTitle, ConfirmDialog } from '@/shared/ui';

export function CartPage() {
    const items = useCartStore((s) => s.items);
    const toggleAllSelected = useCartStore((s) => s.toggleAllSelected);
    const toggleProductSelected = useCartStore((s) => s.toggleProductSelected);
    const toggleServiceSelected = useCartStore((s) => s.toggleServiceSelected);
    const updateProductCount = useCartStore((s) => s.updateProductCount);
    const updateServiceCount = useCartStore((s) => s.updateServiceCount);

    const hasItems = Object.keys(items).length > 0;
    const productIds = Object.entries(items)
        .filter(([, item]) => item.count > 0)
        .map(([id]) => id);
    const { imageUrls, loadingIds } = useCartImages(productIds);
    const totalCount = selectTotalItems(items);
    const allSelected = selectAreAllSelected(items);
    const hasSelected = selectHasSelectedItems(items);

    const dialog = useCartConfirmDialog();

    return (
        <>
            <PageContainer>
                <div className="flex flex-col gap-4 lg:gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <PageTitle>Корзина</PageTitle>
                            {totalCount > 0 && (
                                <span className="badge badge-sm badge-primary">{totalCount}</span>
                            )}
                        </div>

                        {hasItems && (
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
                                    onClick={dialog.requestRemoveSelected}
                                    disabled={!hasSelected}
                                    aria-label="Удалить выбранные"
                                >
                                    <ArchiveBoxXMarkIcon className="size-2.75" />
                                </button>
                            </div>
                        )}
                    </div>

                    {hasItems ? (
                        <CartItemList
                            items={items}
                            imageUrls={imageUrls}
                            imageLoadingIds={loadingIds}
                            onToggleProduct={toggleProductSelected}
                            onToggleService={toggleServiceSelected}
                            onUpdateProductCount={updateProductCount}
                            onUpdateServiceCount={updateServiceCount}
                            onRemoveProduct={dialog.requestRemoveProduct}
                            onRemoveService={dialog.requestRemoveService}
                        />
                    ) : (
                        <CartEmpty />
                    )}
                </div>

                <ConfirmDialog
                    isOpen={dialog.isOpen}
                    onClose={dialog.close}
                    onConfirm={dialog.confirm}
                    title={dialog.title}
                    message={dialog.message}
                    confirmText="Удалить"
                />
            </PageContainer>

            <CartTotal />
        </>
    );
}
