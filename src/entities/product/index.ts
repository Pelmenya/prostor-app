export {
    productKeys,
    fetchTopLevelGroups,
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
    useProductSearch,
    getImageProxyUrl,
} from './api/product.api';

export { useProductThumbnails } from './api/use-product-thumbnails';

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
