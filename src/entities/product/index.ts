export {
    useTopLevelGroups,
    useSubGroups,
    useProducts,
    useProduct,
    useGroupPath,
    useBundleImages,
    getImageProxyUrl,
} from './api/product.api';

export type {
    TProduct,
    TSalePrice,
    TService,
    TAttribute,
    TProductImage,
    TImage,
} from './model/types/t-product';
export type { TGroup, TGroupPath, TSystemBundle } from './model/types/t-group';
export { EServiceCategory } from './model/types/t-product';
