'use client';

import { useSubGroups } from '@/entities/product';
import { GroupList, GroupListSkeleton } from '@/features/catalog';
import { Page } from '@/widgets/page';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { PageTitle } from '@/shared/ui/page-title';
import { CatalogInfoBlock } from '@/shared/ui/catalog-info-block';
import { MAIN_CATALOG_ID } from '@/shared/config';

export function CatalogPage() {
    const { data: groups, isLoading, error } = useSubGroups(MAIN_CATALOG_ID);

    return (
        <Page header={<Header back={false} />} footer={<Footer />} className="bg-base-300">
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
        </Page>
    );
}
