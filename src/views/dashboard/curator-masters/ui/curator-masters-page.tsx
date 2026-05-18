'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useGetCuratorMasters, useGetCuratorUsersCount, CuratorMasterCard } from '@/entities/user';
import { EUserRole } from '@/shared/model';
import { PageContainer, PageTitle, QueryBoundary, InfiniteList } from '@/shared/ui';
import { useDebouncedValue } from '@/shared/lib';

const SERVICE_ROLE = [EUserRole.SERVICE];

export function CuratorMastersPage() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 400);

    return (
        <PageContainer bg="bg-base-200">
            <div className="flex flex-col gap-4 max-w-2xl mx-auto py-4">
                <div className="flex items-center justify-between gap-4">
                    <PageTitle>Мастера</PageTitle>
                    <MastersCount search={debouncedSearch} />
                </div>

                <label className="input input-bordered flex items-center gap-2">
                    <MagnifyingGlassIcon className="size-4 text-base-content/40 shrink-0" />
                    <input
                        type="search"
                        className="grow text-sm"
                        placeholder="Имя, телефон, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>

                <QueryBoundary errorMessage="Ошибка загрузки мастеров">
                    <CuratorMastersContent search={debouncedSearch} />
                </QueryBoundary>
            </div>
        </PageContainer>
    );
}

function MastersCount({ search }: { search: string }) {
    const { data } = useGetCuratorUsersCount({ role: SERVICE_ROLE, search: search || undefined });

    if (data === undefined) return null;

    return <span className="badge badge-ghost shrink-0">{data.count}</span>;
}

function CuratorMastersContent({ search }: { search: string }) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetCuratorMasters({
        limit: 20,
        search: search || undefined,
    });

    const masters = data.pages.flatMap((page) => page.items);

    return (
        <InfiniteList
            items={masters}
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={() => {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            keyExtractor={(user) => user.id}
            className="flex flex-col gap-2"
            emptyComponent={
                <div className="text-center py-12 text-base-content/40 text-sm">
                    {search ? 'Ничего не найдено' : 'Мастеров пока нет'}
                </div>
            }
            renderItem={(user) => <CuratorMasterCard user={user} />}
        />
    );
}
