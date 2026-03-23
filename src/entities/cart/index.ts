export {
    useCartStore,
    selectTotalItems,
    selectTotalPrice,
    selectTotalRateOfHours,
    selectAreAllSelected,
    selectHasSelectedItems,
    selectSelectedItems,
} from './model/cart.store';

export type { TCartItem, TCartServiceItem } from './model/cart.store';
