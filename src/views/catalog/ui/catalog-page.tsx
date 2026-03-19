'use client';

import { useTopLevelGroups } from '@/entities/product';
import { GroupList, GroupListSkeleton } from '@/features/catalog';
import { Header } from '@/widgets/header';
import { PageTitle } from '@/shared/ui/page-title';

export function CatalogPage() {
    const { data: groups, isLoading, error } = useTopLevelGroups();

    return (
        <div className="flex min-h-screen flex-col bg-base-200">
            <Header />
            <main className="flex-1 p-4 md:p-6 xl:p-10">
                <div className="flex flex-col gap-4 lg:gap-6">
                    <PageTitle>Каталог товаров</PageTitle>

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
            </main>
        </div>
    );
}
