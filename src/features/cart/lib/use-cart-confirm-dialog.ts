'use client';

import { useState } from 'react';

import { useCartStore } from '@/entities/cart';

type TDialogData =
    | { type: 'removeSelected' }
    | { type: 'product'; productId: string; productName: string }
    | { type: 'service'; productId: string; serviceId: string };

export function useCartConfirmDialog() {
    const removeSelected = useCartStore((s) => s.removeSelected);
    const removeProduct = useCartStore((s) => s.removeProduct);
    const removeService = useCartStore((s) => s.removeService);

    // isOpen и data разделены: close() только скрывает диалог, не сбрасывая data.
    // Это предотвращает мигание title/message во время анимации закрытия.
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<TDialogData>({ type: 'removeSelected' });

    const requestRemoveSelected = () => {
        setData({ type: 'removeSelected' });
        setIsOpen(true);
    };

    const requestRemoveProduct = (productId: string, productName: string) => {
        setData({ type: 'product', productId, productName });
        setIsOpen(true);
    };

    const requestRemoveService = (productId: string, serviceId: string) => {
        setData({ type: 'service', productId, serviceId });
        setIsOpen(true);
    };

    const close = () => setIsOpen(false);

    const confirm = () => {
        if (data.type === 'removeSelected') {
            removeSelected();
        } else if (data.type === 'product') {
            removeProduct(data.productId);
        } else if (data.type === 'service') {
            removeService(data.productId, data.serviceId);
        }
        close();
    };

    const title =
        data.type === 'removeSelected'
            ? 'Удалить выбранные товары?'
            : data.type === 'product'
              ? 'Удалить товар'
              : 'Удалить услугу';

    const message =
        data.type === 'removeSelected'
            ? 'Вы точно хотите удалить выбранные товары? Отменить действие будет невозможно.'
            : data.type === 'product'
              ? `Вы точно хотите удалить «${data.productName}»? Отменить действие будет невозможно.`
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
