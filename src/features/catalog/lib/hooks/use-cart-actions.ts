import { useCartStore, type TCartItem } from '@/entities/cart';
import type { TProduct, TService } from '@/shared/model';
import { getSalePrices } from '../get-sale-prices';

export function useCartActions(product: TProduct | undefined, productId: string) {
    const cartItem = useCartStore((s) => (productId ? s.items[productId] : undefined)) as
        | TCartItem
        | undefined;
    const addProduct = useCartStore((s) => s.addProduct);
    const updateProductCount = useCartStore((s) => s.updateProductCount);
    const addService = useCartStore((s) => s.addService);
    const updateServiceCount = useCartStore((s) => s.updateServiceCount);

    const productUnitPrice = getSalePrices(product?.salePrices)[0]?.value ?? 0;

    const hasCartItems =
        cartItem &&
        (cartItem.count > 0 ||
            Object.values(cartItem.services).some((svc) => svc.checked && svc.count > 0));

    const handleProductIncrement = () => {
        if (!product) return;
        if (!cartItem) {
            addProduct(product, 1, productUnitPrice);
        } else {
            updateProductCount(productId, cartItem.count + 1);
        }
    };

    const handleProductDecrement = () => {
        if (!cartItem) return;
        updateProductCount(productId, Math.max(cartItem.count - 1, 0));
    };

    const handleServiceIncrement = (serviceId: string) => {
        if (!product) return;
        if (!cartItem) addProduct(product, 0, productUnitPrice);
        const currentCount =
            useCartStore.getState().items[productId]?.services[serviceId]?.count ?? 0;
        updateServiceCount(productId, serviceId, currentCount + 1);
    };

    const handleServiceDecrement = (serviceId: string) => {
        if (!cartItem) return;
        const currentCount =
            useCartStore.getState().items[productId]?.services[serviceId]?.count ?? 0;
        updateServiceCount(productId, serviceId, Math.max(currentCount - 1, 0));
    };

    const handleCheckboxChange = (serviceId: string, price?: number) => {
        if (!product) return;
        if (!cartItem) addProduct(product, 0, productUnitPrice);

        const currentItem = useCartStore.getState().items[productId];
        if (currentItem?.services[serviceId]) {
            const newChecked = !currentItem.services[serviceId].checked;
            updateServiceCount(productId, serviceId, newChecked ? 1 : 0);
        } else {
            const fullService = product.services?.find((s: TService) => s.id === serviceId);
            if (fullService) addService(productId, fullService, 1, price ?? 0);
        }
    };

    return {
        cartItem,
        hasCartItems,
        handleProductIncrement,
        handleProductDecrement,
        handleServiceIncrement,
        handleServiceDecrement,
        handleCheckboxChange,
    };
}
