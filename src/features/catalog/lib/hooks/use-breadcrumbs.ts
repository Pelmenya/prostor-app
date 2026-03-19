import { useGroupPath, type TGroupPath } from '@/entities/product';
import { MAIN_CATALOG_ID } from '@/shared/config';
import type { TBreadcrumb } from '@/shared/ui/breadcrumbs';

export function useCatalogBreadcrumbs(groupId: string, productName?: string) {
    const { data: categoryPath, isLoading } = useGroupPath(groupId);

    const aquaforIndex = categoryPath
        ? categoryPath.findIndex((item: TGroupPath) => item.id === MAIN_CATALOG_ID)
        : -1;
    const filteredPath = aquaforIndex >= 0 ? categoryPath?.slice(aquaforIndex + 1) : categoryPath;

    const breadcrumbs: TBreadcrumb[] = [
        { name: 'Каталог', path: '/catalog' },
        ...(filteredPath
            ? filteredPath.map((item: TGroupPath) => ({
                  name: item.groupName || '',
                  path: `/catalog/${item.id}`,
              }))
            : []),
        ...(productName ? [{ name: productName }] : []),
    ];

    return { breadcrumbs, isLoading };
}
