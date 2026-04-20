'use client';

import { useRef } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
    useProductSearchPaginated,
    useProductSearchCount,
    useProductThumbnails,
} from '@/entities/product';
import { useProductSearchStore } from '../../model/product-search.store';
import { useSearchState } from './use-search-state';
import { SearchModalHeader } from './search-modal-header';
import { SearchList } from '../search-list/search-list';

export function SearchModal() {
    const isOpen = useProductSearchStore((s) => s.isOpen);
    const inputRef = useRef<HTMLInputElement>(null);

    const { innerQuery, setInnerQuery, query, handleClose, handleClear } = useSearchState();

    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
        useProductSearchPaginated(query);

    const { data: countData, isLoading: isLoadingCount } = useProductSearchCount(query);

    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const { imageUrls, loadingIds } = useProductThumbnails(items.map((p) => p.id));

    const handleLoadMore = () => {
        if (hasNextPage && !isFetching) void fetchNextPage();
    };

    const showCount =
        query.length >= 2 &&
        !isLoading &&
        !isFetching &&
        !isLoadingCount &&
        countData !== undefined;

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 hidden lg:block transition-opacity duration-300 ease-out data-closed:opacity-0"
            />

            <div className="fixed inset-0 lg:flex lg:justify-end">
                <DialogPanel
                    transition
                    className="fixed inset-0 flex flex-col h-dvh bg-base-300 lg:relative lg:max-h-163.5 lg:w-full lg:shadow-xl lg:rounded-b-2xl lg:overflow-hidden transition duration-300 ease-out data-closed:lg:-translate-y-full"
                >
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <SearchModalHeader
                            innerQuery={innerQuery}
                            inputRef={inputRef}
                            countData={countData}
                            showCount={showCount}
                            onClose={handleClose}
                            onClear={handleClear}
                            onChange={setInnerQuery}
                        />

                        <main className="flex-1 overflow-y-auto">
                            {query.length >= 2 && (
                                <SearchList
                                    items={items}
                                    hasMore={!!hasNextPage}
                                    isLoading={isLoading}
                                    isFetching={isFetching}
                                    imageUrls={imageUrls}
                                    loadingIds={loadingIds}
                                    onLoadMore={handleLoadMore}
                                    onClose={handleClose}
                                />
                            )}
                        </main>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
