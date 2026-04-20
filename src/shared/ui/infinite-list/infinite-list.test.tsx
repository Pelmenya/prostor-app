import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useInView } from 'react-intersection-observer';
import { InfiniteList } from './infinite-list';

vi.mock('react-intersection-observer', () => ({
    useInView: vi.fn(() => ({ ref: vi.fn(), inView: false })),
}));

const mockUseInView = vi.mocked(useInView);

describe('InfiniteList', () => {
    it('показывает loading при пустом списке и isLoading=true', () => {
        render(
            <InfiniteList
                items={[]}
                hasMore={false}
                isLoading={true}
                onLoadMore={vi.fn()}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
            />,
        );
        expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('показывает emptyComponent когда список пуст и не загружается', () => {
        render(
            <InfiniteList
                items={[]}
                hasMore={false}
                isLoading={false}
                onLoadMore={vi.fn()}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
                emptyComponent={<p>Пусто</p>}
            />,
        );
        expect(screen.getByText('Пусто')).toBeInTheDocument();
    });

    it('рендерит items через renderItem', () => {
        render(
            <InfiniteList
                items={['A', 'B']}
                hasMore={false}
                isLoading={false}
                onLoadMore={vi.fn()}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
            />,
        );
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('вызывает onLoadMore когда inView=true и hasMore=true', async () => {
        const onLoadMore = vi.fn();
        mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true } as unknown as ReturnType<
            typeof useInView
        >);

        render(
            <InfiniteList
                items={['A']}
                hasMore={true}
                isLoading={false}
                onLoadMore={onLoadMore}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
            />,
        );

        await act(async () => {});
        expect(onLoadMore).toHaveBeenCalled();
    });

    it('НЕ вызывает onLoadMore когда hasMore=false', async () => {
        const onLoadMore = vi.fn();
        mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true } as unknown as ReturnType<
            typeof useInView
        >);

        render(
            <InfiniteList
                items={['A']}
                hasMore={false}
                isLoading={false}
                onLoadMore={onLoadMore}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
            />,
        );

        await act(async () => {});
        expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('НЕ вызывает onLoadMore когда isLoading=true', async () => {
        const onLoadMore = vi.fn();
        mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true } as unknown as ReturnType<
            typeof useInView
        >);

        render(
            <InfiniteList
                items={['A']}
                hasMore={true}
                isLoading={true}
                onLoadMore={onLoadMore}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
            />,
        );

        await act(async () => {});
        expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('показывает errorComponent при isError=true', () => {
        render(
            <InfiniteList
                items={[]}
                hasMore={false}
                isLoading={false}
                onLoadMore={vi.fn()}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
                isError={true}
                errorComponent={<p>Ошибка сети</p>}
            />,
        );
        expect(screen.getByText('Ошибка сети')).toBeInTheDocument();
    });

    it('показывает дефолтный текст ошибки если errorComponent не передан', () => {
        render(
            <InfiniteList
                items={[]}
                hasMore={false}
                isLoading={false}
                onLoadMore={vi.fn()}
                renderItem={(x: string) => <span>{x}</span>}
                keyExtractor={(x) => x}
                isError={true}
            />,
        );
        expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
    });
});
