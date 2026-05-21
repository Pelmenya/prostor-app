// Public API features/smart-search.
//
// Phase 1 (slovo handoff 2026-05-15..16):
//  - SmartSearchInput — sticky entry-point под top-bar
//  - SmartSearchOverlay — BottomSheetModal с 3 states (idle/loading/results)
//  - WaterDrop из @/shared/ui — brand-маркер фичи (единый, не дубль)
//  - useSmartSearchStore — Zustand с recentQueries persist
//
// API hook + types — для интеграции из других features (Phase 1.5+).

export { SmartSearchInput } from './ui/smart-search-input/smart-search-input';
export { SmartSearchOverlay } from './ui/smart-search-overlay/smart-search-overlay';
export { useSmartSearchStore } from './model/smart-search.store';
export { useSmartSearch } from './api/use-smart-search';
export type {
    TVisionConfidence,
    TVisionDto,
    TSearchDoc,
    TSearchResponse,
    TSearchRequest,
    TSmartSearchStatus,
} from './model/types';
