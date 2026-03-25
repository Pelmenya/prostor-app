export {
    productKeys,
    fetchSubGroups,
    fetchProducts,
    fetchGroupPath,
    fetchProduct,
    useTopLevelGroups,
    useSubGroups,
    useProducts,
    useProduct,
    useGroupPath,
    useProductImages,
    useBundleImages,
    getImageProxyUrl,
} from './api/product.api';

// Реэкспорт типов из shared/types (единый источник правды)
export type {
    TProduct,
    TSalePrice,
    TService,
    TAttribute,
    TProductImage,
    TImage,
    TGroup,
    TGroupPath,
    TSystemBundle,
} from '@/shared/model';

export { EServiceCategory } from '@/shared/model';
