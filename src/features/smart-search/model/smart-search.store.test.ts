import { describe, it, expect, beforeEach } from 'vitest';
import { useSmartSearchStore } from './smart-search.store';

/**
 * Tests для useSmartSearchStore — Zustand store с persist (recentQueries в
 * localStorage, остальное ephemeral). Cover'аем:
 *  - pushRecentQuery: trim, dedupe, prepend, slice(MAX=3)
 *  - resetSearch: clears query/image/status/vision/results/error, keeps recentQueries
 *  - setResponse: sets status=success + error=null
 *  - setError: sets status='error' (or 'idle' if null)
 *  - openOverlay / closeOverlay toggles
 */

describe('useSmartSearchStore', () => {
    beforeEach(() => {
        // Reset store к initial state (recentQueries сохраняется в localStorage
        // мок-jsdom — очищаем через clearRecentQueries + resetSearch + close).
        const s = useSmartSearchStore.getState();
        s.clearRecentQueries();
        s.resetSearch();
        s.closeOverlay();
    });

    describe('overlay toggle', () => {
        it('openOverlay sets isOverlayOpen=true', () => {
            useSmartSearchStore.getState().openOverlay();
            expect(useSmartSearchStore.getState().isOverlayOpen).toBe(true);
        });

        it('closeOverlay sets isOverlayOpen=false', () => {
            useSmartSearchStore.getState().openOverlay();
            useSmartSearchStore.getState().closeOverlay();
            expect(useSmartSearchStore.getState().isOverlayOpen).toBe(false);
        });
    });

    describe('pushRecentQuery', () => {
        it('добавляет query в начало списка', () => {
            useSmartSearchStore.getState().pushRecentQuery('фильтр');
            expect(useSmartSearchStore.getState().recentQueries).toEqual(['фильтр']);
        });

        it('пустую/whitespace строку игнорирует', () => {
            useSmartSearchStore.getState().pushRecentQuery('');
            useSmartSearchStore.getState().pushRecentQuery('   ');
            expect(useSmartSearchStore.getState().recentQueries).toEqual([]);
        });

        it('обрезает whitespace по краям', () => {
            useSmartSearchStore.getState().pushRecentQuery('  фильтр  ');
            expect(useSmartSearchStore.getState().recentQueries).toEqual(['фильтр']);
        });

        it('dedupes: повторяющийся query поднимается в top, без дубля', () => {
            const s = useSmartSearchStore.getState();
            s.pushRecentQuery('one');
            s.pushRecentQuery('two');
            s.pushRecentQuery('one');
            expect(useSmartSearchStore.getState().recentQueries).toEqual(['one', 'two']);
        });

        it('keeps max 3 entries (oldest removed)', () => {
            const s = useSmartSearchStore.getState();
            s.pushRecentQuery('q1');
            s.pushRecentQuery('q2');
            s.pushRecentQuery('q3');
            s.pushRecentQuery('q4');
            expect(useSmartSearchStore.getState().recentQueries).toEqual(['q4', 'q3', 'q2']);
        });
    });

    describe('resetSearch', () => {
        it('clears query / image / status / vision / results / error', () => {
            const s = useSmartSearchStore.getState();
            s.setQuery('test');
            s.setImage({ dataUrl: 'data:image/jpeg;base64,X', mime: 'image/jpeg', sizeBytes: 100 });
            s.setStatus('loading');
            s.setResponse({
                vision: { category: 'cat', description: 'desc', confidence: 'high' },
                results: [
                    {
                        id: '1',
                        pageContent: '',
                        metadata: { externalId: 'x', name: 'y', salePriceKopecks: 1000 },
                        imageUrls: [],
                        matchScore: 95,
                    },
                ],
            });
            s.resetSearch();
            const after = useSmartSearchStore.getState();
            expect(after.query).toBe('');
            expect(after.image).toBeNull();
            expect(after.status).toBe('idle');
            expect(after.vision).toBeNull();
            expect(after.results).toEqual([]);
            expect(after.error).toBeNull();
        });

        it('keeps recentQueries после reset', () => {
            const s = useSmartSearchStore.getState();
            s.pushRecentQuery('keepme');
            s.setQuery('temp');
            s.resetSearch();
            expect(useSmartSearchStore.getState().recentQueries).toEqual(['keepme']);
        });
    });

    describe('setResponse / setError state transitions', () => {
        it('setResponse → status=success + error cleared', () => {
            const s = useSmartSearchStore.getState();
            s.setError('prev error');
            s.setResponse({ vision: null, results: [] });
            const after = useSmartSearchStore.getState();
            expect(after.status).toBe('success');
            expect(after.error).toBeNull();
        });

        it('setError(null) → status=idle', () => {
            const s = useSmartSearchStore.getState();
            s.setError('test');
            expect(useSmartSearchStore.getState().status).toBe('error');
            s.setError(null);
            const after = useSmartSearchStore.getState();
            expect(after.status).toBe('idle');
            expect(after.error).toBeNull();
        });

        it('setError(message) → status=error + error stored', () => {
            useSmartSearchStore.getState().setError('Network failed');
            const after = useSmartSearchStore.getState();
            expect(after.error).toBe('Network failed');
            expect(after.status).toBe('error');
        });
    });

    describe('image lifecycle', () => {
        it('setImage stores image dataUrl + mime + size', () => {
            useSmartSearchStore.getState().setImage({
                dataUrl: 'data:image/png;base64,Z',
                mime: 'image/png',
                sizeBytes: 2048,
            });
            expect(useSmartSearchStore.getState().image).toEqual({
                dataUrl: 'data:image/png;base64,Z',
                mime: 'image/png',
                sizeBytes: 2048,
            });
        });

        it('clearImage обнуляет image', () => {
            const s = useSmartSearchStore.getState();
            s.setImage({ dataUrl: 'data:', mime: 'image/jpeg', sizeBytes: 1 });
            s.clearImage();
            expect(useSmartSearchStore.getState().image).toBeNull();
        });
    });
});
