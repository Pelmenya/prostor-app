'use client';

import { useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import {
    ArrowRightIcon,
    CameraIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { BottomSheetModal, WaterDrop } from '@/shared/ui';
import { useCartStore } from '@/entities/cart';
import { useSmartSearchStore } from '../../model/smart-search.store';
import { useSmartSearch } from '../../api/use-smart-search';
import { useThrottleRemaining } from '../../model/throttle-tracker';
import type { TSmartSearchChipKind } from '../../model/types';
import { ChipSuggestions } from '../chip-suggestions/chip-suggestions';
import { RecentSearchesList } from '../recent-searches-list/recent-searches-list';
import { AiPipelineStages } from '../ai-pipeline-stages/ai-pipeline-stages';
import { MatchScoreRing } from '../match-score-ring/match-score-ring';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * AI vision pill (full-width) — gradient pill между search input и cards
 * на mobile results. Single line: sparkle + «AI распознал · {category} · {top%}».
 * На desktop этот summary дублируется в sidebar более detail'но (см. ниже).
 */
function AiVisionPill({
    vision,
    topScore,
}: {
    vision: { category: string; confidence: 'low' | 'mid' | 'high' };
    topScore?: number;
}) {
    return (
        <div className="rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/15 border border-primary/25 px-3 py-2 inline-flex items-center gap-2 w-full">
            <SparklesIcon className="size-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-base-content/85">AI распознал</span>
            <span className="text-base-content/35">·</span>
            <span className="text-sm font-medium text-base-content lowercase truncate flex-1 min-w-0">
                {vision.category}
            </span>
            {topScore !== undefined && (
                <span className="ml-auto inline-flex items-center gap-1 shrink-0">
                    <span
                        className={`size-1.5 rounded-full ${
                            vision.confidence === 'high'
                                ? 'bg-success'
                                : vision.confidence === 'mid'
                                  ? 'bg-warning'
                                  : 'bg-error'
                        }`}
                    />
                    <span className="text-xs font-bold text-primary tabular-nums">
                        {Math.round(topScore)}%
                    </span>
                </span>
            )}
        </div>
    );
}

/**
 * Overlay с 3 states (idle / loading / results). State определяется по
 * `status` из store + наличию results. UI mapping:
 *   - status='loading' → AI pipeline stages
 *   - status='success' и results.length > 0 → results
 *   - status='error' → error block + retry
 *   - всё остальное (idle / success без results) → idle с chips + recent
 *
 * Reuse: BottomSheetModal (drag-to-dismiss, footer slot, sm+ centered modal).
 * EquipmentRecommendationCard shape — inline (image + name + matchScore badge
 * + price + actions). Не экстрагирую в shared/ui пока shape не стабилен через
 * Phase 1 → 1.5 use cases.
 */
export function SmartSearchOverlay() {
    const isOpen = useSmartSearchStore((s) => s.isOverlayOpen);
    const close = useSmartSearchStore((s) => s.closeOverlay);
    const query = useSmartSearchStore((s) => s.query);
    const setQuery = useSmartSearchStore((s) => s.setQuery);
    const image = useSmartSearchStore((s) => s.image);
    const setImage = useSmartSearchStore((s) => s.setImage);
    const clearImage = useSmartSearchStore((s) => s.clearImage);
    const status = useSmartSearchStore((s) => s.status);
    const vision = useSmartSearchStore((s) => s.vision);
    const results = useSmartSearchStore((s) => s.results);
    const error = useSmartSearchStore((s) => s.error);
    const resetSearch = useSmartSearchStore((s) => s.resetSearch);
    const addProduct = useCartStore((s) => s.addProduct);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mutation = useSmartSearch();

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_IMAGE_BYTES) {
            alert('Фото больше 5MB — выберите поменьше');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setImage({ dataUrl, mime: f.type, sizeBytes: f.size });
        };
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim() && !image) return;
        // base64 = data:image/jpeg;base64,XXXX — берём часть после запятой
        const images = image
            ? [{ base64: image.dataUrl.split(',')[1] ?? '', mime: image.mime }]
            : undefined;
        mutation.mutate({
            query: query.trim() || undefined,
            topK: 5,
            images,
        });
    };

    const handleChipPick = (chip: { kind: TSmartSearchChipKind; placeholder: string }) => {
        if (chip.kind === 'photo') {
            fileInputRef.current?.click();
            return;
        }
        if (chip.kind === 'address') {
            // TODO Phase 1.5: открывать address-picker отдельным flow.
            // Пока — placeholder в input, юзер набирает текстом.
            setQuery('адрес: ');
            return;
        }
        setQuery(chip.placeholder);
    };

    const handleRecentPick = (q: string) => {
        setQuery(q);
        mutation.mutate({ query: q, topK: 5 });
    };

    const handleClose = () => {
        close();
        // Не reset'им results — юзер может вернуться к ним. Очистка на новом submit
    };

    const isLoading = status === 'loading' || mutation.isPending;
    const showResults = status === 'success' && results.length > 0;
    const showError = status === 'error';
    const showIdle = !isLoading && !showResults && !showError;

    const timeTakenMs = mutation.data?.timeTakenMs;
    const throttleRemaining = useThrottleRemaining();
    const showThrottleWarn = throttleRemaining > 0 && throttleRemaining < 3;

    // Frontend dedupe по externalId — idempotent safety net поверх backend
    // dedupe (slovo Phase 1.5 Slice 1 `eab20c9` 2026-05-17 уже dedups chunks
    // на бэке + over-fetch multiplier 5). Backend explicitly спроектировал
    // двух-слойную защиту («Frontend dedupe остаётся (idempotent safety net)
    // — не coupled change»). Если backend regression / edge case — frontend
    // не упадёт с React key collision.
    const seenIds = new Set<string>();
    const dedupedResults = results.filter((doc) => {
        const key = doc.metadata.externalId;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
    });

    return (
        <BottomSheetModal
            isOpen={isOpen}
            onClose={handleClose}
            className="sm:max-w-2xl lg:max-w-5xl"
        >
            {/* IDLE — Hero card: light-blue gradient bg + 56×56 WaterDrop square +
                title + AI badge + subtitle. Полная visual hierarchy «central feature».
                В loading/results/error — compact header чтобы не съедать viewport. */}
            {showIdle ? (
                <header className="relative rounded-2xl p-4 -mx-1 -mt-1 flex items-start gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-base-100 border border-primary/20">
                    <div className="size-14 rounded-2xl bg-base-100 shadow-md flex items-center justify-center shrink-0">
                        <WaterDrop size={40} animated />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-lg font-bold text-base-content leading-tight">
                                Умный поиск
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary-content bg-gradient-to-r from-primary to-secondary">
                                <SparklesIcon className="size-3" />
                                AI
                            </span>
                        </div>
                        <p className="text-sm text-base-content/65 leading-snug mt-1">
                            Опишите словами или сфотографируйте
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-ghost btn-sm btn-square -mr-1 -mt-1"
                        aria-label="Закрыть"
                    >
                        <XMarkIcon className="size-5" />
                    </button>
                </header>
            ) : (
                <header className="flex items-center gap-2 -mt-1">
                    <WaterDrop size={26} />
                    <h2 className="text-base font-bold text-base-content">Умный поиск</h2>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-primary-content bg-gradient-to-r from-primary to-secondary">
                        <SparklesIcon className="size-3" />
                        AI
                    </span>
                    {showResults && timeTakenMs !== undefined && (
                        <span className="text-xs text-base-content/55 ml-2 hidden sm:inline">
                            {dedupedResults.length}{' '}
                            {dedupedResults.length === 1
                                ? 'результат'
                                : dedupedResults.length < 5
                                  ? 'результата'
                                  : 'результатов'}{' '}
                            · {(timeTakenMs / 1000).toFixed(1)} с
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="ml-auto btn btn-ghost btn-sm btn-square"
                        aria-label="Закрыть"
                    >
                        <XMarkIcon className="size-5" />
                    </button>
                </header>
            )}

            {/* Input bar — всегда видим (любое состояние) */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="relative">
                    <MagnifyingGlassIcon className="size-5 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="например: фильтр под мойку как у мамы"
                        className="input input-bordered w-full pl-10 pr-12 h-11"
                        autoFocus
                    />
                    {/* Camera button — синий gradient circle (design uplift 2026-05-18).
                        Primary CTA для photo upload, contrastный против plain input. */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 inline-flex items-center justify-center rounded-lg text-primary-content bg-gradient-to-br from-primary to-secondary shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer"
                        aria-label="Сфотографировать или загрузить фото"
                        title="Сфотографировать или загрузить фото"
                    >
                        <CameraIcon className="size-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={handleFile}
                        className="hidden"
                    />
                </div>

                {image && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-base-200 text-xs text-base-content/80">
                        <span aria-hidden="true">📷</span>
                        <span className="truncate flex-1">
                            Фото · {(image.sizeBytes / 1024 / 1024).toFixed(1)} MB · {image.mime}
                        </span>
                        <button
                            type="button"
                            onClick={clearImage}
                            className="text-base-content/50 hover:text-base-content cursor-pointer"
                            aria-label="Убрать фото"
                        >
                            <XMarkIcon className="size-4" />
                        </button>
                    </div>
                )}

                {/* CTA скрыта в results — после submit'а кнопка лишний noise.
                    Юзер видит товары; чтобы повторить с новыми условиями — нажимает
                    «← Новый поиск» внизу и возвращается в idle, где CTA снова появится. */}
                {(query.trim() || image) && !showResults && (
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary btn-sm gap-1.5"
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner loading-xs" />
                        ) : (
                            <MagnifyingGlassIcon className="size-4" />
                        )}
                        Найти
                    </button>
                )}
            </form>

            {/* IDLE — chips + recent + branded footer */}
            {showIdle && (
                <>
                    <ChipSuggestions onPick={handleChipPick} />
                    <RecentSearchesList onPick={handleRecentPick} />
                    <p className="text-xs text-base-content/55 text-center mt-auto pt-2 inline-flex items-center justify-center gap-1.5">
                        <SparklesIcon className="size-3 text-primary" />
                        <WaterDrop size={14} />
                        <span>
                            Найдём оборудование за{' '}
                            <span className="font-bold text-base-content/80">1 секунду</span>
                        </span>
                    </p>
                </>
            )}

            {/* LOADING — pipeline stages */}
            {isLoading && <AiPipelineStages />}

            {/* RESULTS — vision pill + (desktop: sidebar + grid / mobile: grid only) */}
            {showResults && (
                <>
                    {/* Text-only path: thin top gradient strip как visual cue brand-engagement.
                        На vision path не нужен (vision pill ниже + sidebar делают полировку). */}
                    {!vision && (
                        <div className="hidden lg:block -mx-4 -mt-2 mb-1 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />
                    )}

                    {/* AI vision pill — full-width gradient, sparkle + category + matchScore.
                        Mobile: между search input и cards (виден сразу).
                        Desktop vision: дублируется в sidebar (более detail'но) — здесь короткий summary. */}
                    {vision && (
                        <div className="lg:hidden">
                            <AiVisionPill vision={vision} topScore={results[0]?.matchScore} />
                        </div>
                    )}

                    <div className="lg:flex lg:gap-4 lg:items-start">
                        {/* Desktop sidebar 280px — conditional (vision !== null).
                            AI распознал · photo placeholder · category · description ·
                            «Уточнить запрос» + user-facing footer метаданные. */}
                        {vision && (
                            <aside className="hidden lg:flex lg:flex-col gap-3 w-[280px] shrink-0 rounded-xl bg-gradient-to-br from-primary/8 via-primary/4 to-base-100 border border-primary/20 p-4">
                                <div className="inline-flex items-center gap-1.5">
                                    <SparklesIcon className="size-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                        AI распознал
                                    </span>
                                    <span
                                        className={`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            vision.confidence === 'high'
                                                ? 'bg-success/15 text-success'
                                                : vision.confidence === 'mid'
                                                  ? 'bg-warning/15 text-warning'
                                                  : 'bg-error/15 text-error'
                                        }`}
                                    >
                                        {vision.confidence === 'high'
                                            ? 'HIGH'
                                            : vision.confidence === 'mid'
                                              ? 'MID'
                                              : 'LOW'}
                                    </span>
                                </div>
                                {/* Photo placeholder — TODO Phase 1.5 заменить на real photo thumb
                                    когда image uploaded (image.dataUrl). Сейчас просто gradient block. */}
                                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                    {image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={image.dataUrl}
                                            alt="Ваше фото"
                                            className="size-full rounded-lg object-cover"
                                        />
                                    ) : (
                                        <CameraIcon className="size-12 text-primary/40" />
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-base-content lowercase">
                                    {vision.category}
                                </p>
                                <p className="text-xs text-base-content/65 leading-snug line-clamp-4">
                                    {vision.description}
                                </p>
                                {vision.confidence === 'low' && (
                                    <button
                                        type="button"
                                        onClick={resetSearch}
                                        className="btn btn-primary btn-sm w-full normal-case mt-1"
                                    >
                                        Уточнить запрос
                                    </button>
                                )}
                                {timeTakenMs !== undefined && (
                                    <p className="text-[10px] text-base-content/45 text-center mt-auto pt-2 inline-flex items-center justify-center gap-1">
                                        <SparklesIcon className="size-3 text-primary/70" />
                                        AI распознал за {(timeTakenMs / 1000).toFixed(1)} с
                                    </p>
                                )}
                            </aside>
                        )}

                        <section aria-label="Найденные товары" className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                                    Подходящие товары · {dedupedResults.length}
                                </h3>
                                {/* «Фильтр · все» — Phase 2 placeholder per design uplift mockup */}
                                <button
                                    type="button"
                                    disabled
                                    className="text-xs text-primary/60 cursor-not-allowed"
                                    title="Фильтры — Phase 2"
                                >
                                    Фильтр · все
                                </button>
                            </div>
                            {/* 1-column mobile / 2-column lg desktop */}
                            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
                                {dedupedResults.map((doc) => {
                                    const priceRub =
                                        doc.metadata.salePriceKopecks !== null
                                            ? doc.metadata.salePriceKopecks / 100
                                            : null;
                                    const handleAddToCart = (e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addProduct(
                                            {
                                                id: doc.metadata.externalId,
                                                name: doc.metadata.name,
                                                description: doc.pageContent,
                                                attributes: [],
                                            },
                                            1,
                                            priceRub ?? 0,
                                        );
                                    };
                                    const imageUrl = doc.imageUrls[0];
                                    const categoryTag = doc.metadata.categoryPath
                                        ?.split('/')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                        .at(-1);
                                    const subtitle = doc.metadata.description?.trim() || null;
                                    return (
                                        <li
                                            key={doc.metadata.externalId}
                                            className="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden flex flex-col"
                                        >
                                            <Link
                                                href={`/product/${doc.metadata.externalId}`}
                                                onClick={handleClose}
                                                className="flex gap-3 p-3 hover:bg-base-200/30 transition flex-1"
                                            >
                                                {/* Image bg light-blue tint (design uplift) — не plain gray */}
                                                {imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={imageUrl}
                                                        alt={doc.metadata.name}
                                                        className="size-20 rounded-lg object-cover bg-primary/5 shrink-0"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="size-20 rounded-lg bg-primary/5 shrink-0 flex items-center justify-center text-primary/30 text-xs">
                                                        нет фото
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {categoryTag && (
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 leading-tight">
                                                            {categoryTag}
                                                        </p>
                                                    )}
                                                    <div className="flex items-start justify-between gap-2 mt-0.5">
                                                        <p className="text-sm font-medium text-base-content leading-tight line-clamp-2">
                                                            {doc.metadata.name}
                                                        </p>
                                                        {/* MatchScoreRing — большой % внутри ring (design uplift) */}
                                                        <MatchScoreRing score={doc.matchScore} />
                                                    </div>
                                                    {subtitle && (
                                                        <p className="text-xs text-base-content/65 mt-1 leading-snug line-clamp-2">
                                                            {subtitle}
                                                        </p>
                                                    )}
                                                    {priceRub !== null && (
                                                        <p className="text-sm font-bold text-base-content mt-1.5 tabular-nums">
                                                            {priceRub.toLocaleString('ru-RU')} ₽
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="border-t border-base-content/10 px-3 py-2 flex items-center gap-2 bg-base-200/20">
                                                <Link
                                                    href={`/product/${doc.metadata.externalId}`}
                                                    onClick={handleClose}
                                                    className="btn btn-outline btn-sm flex-1 normal-case"
                                                >
                                                    Подробнее
                                                </Link>
                                                {/* «В корзину →» gradient bold — primary CTA (design uplift) */}
                                                <button
                                                    type="button"
                                                    onClick={handleAddToCart}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-sm font-bold text-primary-content bg-gradient-to-r from-primary to-secondary shadow-sm hover:shadow-md active:scale-95 transition cursor-pointer normal-case"
                                                >
                                                    В корзину
                                                    <ArrowRightIcon className="size-3.5" />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <button
                            type="button"
                            onClick={resetSearch}
                            className="text-xs text-base-content/55 hover:text-base-content transition cursor-pointer"
                        >
                            ← Новый поиск
                        </button>
                        {/* Throttle warning — показываем только когда осталось <3 запросов */}
                        {showThrottleWarn && (
                            <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                Осталось {throttleRemaining}{' '}
                                {throttleRemaining === 1 ? 'запрос' : 'запроса'} / мин
                            </span>
                        )}
                    </div>
                </>
            )}

            {/* ERROR */}
            {showError && (
                <div className="py-8 text-center">
                    <p className="text-sm text-error font-medium mb-1">
                        Не удалось получить результаты
                    </p>
                    <p className="text-xs text-base-content/60 mb-4">{error}</p>
                    <button
                        type="button"
                        onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
                        className="btn btn-sm btn-ghost"
                    >
                        Повторить
                    </button>
                </div>
            )}
        </BottomSheetModal>
    );
}
