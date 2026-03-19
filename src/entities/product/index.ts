export {
    useTopLevelGroups,
    useSubGroups,
    useSubGroupsBySlug,
    useProducts,
    useProductsBySlug,
    useProduct,
    useProductBySlug,
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
