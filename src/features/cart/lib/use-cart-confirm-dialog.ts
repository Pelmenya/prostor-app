'use client';

import { useState } from 'react';

import { useCartStore } from '@/entities/cart';

type TDialogState =
    | { type: null }
    | { type: 'removeSelected' }
    | { type: 'product'; productId: string; productName: string }
    | { type: 'service'; productId: string; serviceId: string };

export function useCartConfirmDialog() {
    const removeSelected = useCartStore((s) => s.removeSelected);
    const removeProduct = useCartStore((s) => s.removeProduct);
    const removeService = useCartStore((s) => s.removeService);

    const [dialog, setDialog] = useState<TDialogState>({ type: null });

    const isOpen = dialog.type !== null;

    const requestRemoveSelected = () => setDialog({ type: 'removeSelected' });

    const requestRemoveProduct = (productId: string, productName: string) =>
        setDialog({ type: 'product', productId, productName });

    const requestRemoveService = (productId: string, serviceId: string) =>
        setDialog({ type: 'service', productId, serviceId });

    const close = () => setDialog({ type: null });

    const confirm = () => {
        if (dialog.type === 'removeSelected') {
            removeSelected();
        } else if (dialog.type === 'product') {
            removeProduct(dialog.productId);
        } else if (dialog.type === 'service') {
            removeService(dialog.productId, dialog.serviceId);
        }
        close();
    };

    const title =
        dialog.type === 'removeSelected'
            ? 'Удалить выбранные товары?'
            : dialog.type === 'product'
              ? 'Удалить товар'
              : 'Удалить услугу';

    const message =
        dialog.type === 'removeSelected'
            ? 'Вы точно хотите удалить выбранные товары? Отменить действие будет невозможно.'
            : dialog.type === 'product'
              ? `Вы точно хотите удалить «${dialog.productName}»? Отменить действие будет невозможно.`
              : 'Вы точно хотите удалить выбранную услугу? Отменить действие будет невозможно.';

    return {
        isOpen,
        title,
        message,
        close,
        confirm,
        requestRemoveSelected,
        requestRemoveProduct,
        requestRemoveService,
    };
}
