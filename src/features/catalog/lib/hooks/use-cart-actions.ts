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
        updateServiceCount(productId, serviceId, (cartItem?.services[serviceId]?.count || 0) + 1);
    };

    const handleServiceDecrement = (serviceId: string) => {
        if (!cartItem) return;
        updateServiceCount(
            productId,
            serviceId,
            Math.max((cartItem.services[serviceId]?.count || 0) - 1, 0),
        );
    };

    const handleCheckboxChange = (serviceId: string, rateOfHours: number, price?: number) => {
        if (!product) return;
        if (!cartItem) addProduct(product, 0, productUnitPrice);

        if (cartItem?.services[serviceId]) {
            const newChecked = !cartItem.services[serviceId].checked;
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
