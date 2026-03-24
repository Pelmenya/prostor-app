'use client';

import { useSubGroups } from '@/entities/product';
import { GroupList, GroupListSkeleton } from '@/features/catalog';
import { PageContainer, PageTitle, CatalogInfoBlock } from '@/shared/ui';
import { MAIN_CATALOG_ID } from '@/shared/config';

export function CatalogPage() {
    const { data: groups, isLoading, error } = useSubGroups(MAIN_CATALOG_ID);

    return (
        <PageContainer>
            <div className="flex flex-col gap-4 lg:gap-6">
                <PageTitle>Каталог товаров и услуг</PageTitle>
                <CatalogInfoBlock>
                    Все сервисные услуги вы найдёте в&nbsp;карточке товара
                </CatalogInfoBlock>

                {isLoading && <GroupListSkeleton />}

                {error && (
                    <div className="alert alert-error">
                        <span>
                            Ошибка загрузки каталога:{' '}
                            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
                        </span>
                    </div>
                )}

                {groups && groups.length > 0 && <GroupList groups={groups} />}

                {groups && groups.length === 0 && (
                    <p className="text-center text-base-content/60">Каталог пуст</p>
                )}
            </div>
        </PageContainer>
    );
}
