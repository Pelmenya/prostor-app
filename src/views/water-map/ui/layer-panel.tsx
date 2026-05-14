'use client';

import { useState } from 'react';
import { ChevronDownIcon, MapPinIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNearestRetailStoresByCoords } from '@/entities/real-estate';
import { WaterDrop } from '@/shared/ui';
import { useClientPinStore, useWaterMapStore } from '../model';
import { AllParamsModal } from './all-params-modal';
import { LayerToggleRow } from './layer-toggle-row';
import { ParamPills } from './param-pills';
import { RealEstatePicker } from './real-estate-picker';
import { ViewModeToggle } from './view-mode-toggle';

type TLayerPanelProps = {
    open: boolean;
    onClose: () => void;
};

type TSectionKey = 'layers' | 'location' | 'analytics';

/**
 * Панель управления слоями (P1.5 Variant B). Адаптивная:
 *  - mobile (<lg): bottom-sheet (slide-up снизу)
 *  - lg+: sidebar слева 360px (всегда виден когда open=true)
 *
 * Структура:
 *  - sticky-bar сверху (если heatmap on): ParamPills + ViewMode + «Все 22»
 *  - accordion «Слои на карте · N» (expanded by default) — 5 toggle layer'ов
 *  - accordion «Местоположение» (expanded если есть pin) — pin label + picker
 *  - accordion «Аналитика по району» (collapsed by default) — similar + тип воды
 *
 * Accordion state persist'ится через water-map store (см. panelSections).
 * `null` = follow default heuristic, true/false = explicit user override.
 */
export function LayerPanel({ open, onClose }: TLayerPanelProps) {
    const selectedParam = useWaterMapStore((s) => s.selectedParam);
    const setSelectedParam = useWaterMapStore((s) => s.setSelectedParam);
    const activeLayers = useWaterMapStore((s) => s.activeLayers);
    const setLayer = useWaterMapStore((s) => s.setLayer);
    const similarOn = useWaterMapStore((s) => s.similarOn);
    const setSimilarOn = useWaterMapStore((s) => s.setSimilarOn);
    const setAquiferStatsOpen = useWaterMapStore((s) => s.setAquiferStatsOpen);
    const cellsViewMode = useWaterMapStore((s) => s.cellsViewMode);
    const setCellsViewMode = useWaterMapStore((s) => s.setCellsViewMode);
    const panelSections = useWaterMapStore((s) => s.panelSections);
    const setPanelSection = useWaterMapStore((s) => s.setPanelSection);
    const pin = useClientPinStore((s) => s.pin);
    const setPin = useClientPinStore((s) => s.setPin);
    const pinPlacementMode = useWaterMapStore((s) => s.pinPlacementMode);
    const setPinPlacementMode = useWaterMapStore((s) => s.setPinPlacementMode);
    const [allParamsOpen, setAllParamsOpen] = useState(false);

    // Default open per section. `null` = follow heuristic, иначе respect override.
    const layersOpen = panelSections.layers ?? true;
    const locationOpen = panelSections.location ?? Boolean(pin);
    const analyticsOpen = panelSections.analytics ?? false;

    const heatmapOn = activeLayers.has('heatmap');
    const layersCount = activeLayers.size;

    const requestGeolocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPin({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    source: 'geolocation',
                    label: 'Текущее местоположение',
                });
            },
            () => {},
            { enableHighAccuracy: false, timeout: 5000 },
        );
    };

    const pinSourceLabel = (() => {
        if (!pin) return null;
        if (pin.source === 'geolocation') return 'Геолокация';
        if (pin.source === 'real-estate') return 'Объект';
        return 'Вручную';
    })();

    // Пре-проверка stores для badge возле toggle. Тот же запрос делает canvas
    // — useQuery дедупит cache.
    const storesQuery = useNearestRetailStoresByCoords(
        activeLayers.has('stores') && pin ? { lat: pin.lat, lon: pin.lon, limit: 20 } : null,
    );
    const storesAccessory = (() => {
        if (!activeLayers.has('stores') || !pin) return undefined;
        if (storesQuery.isLoading) {
            return <span className="loading loading-spinner loading-xs" />;
        }
        if (storesQuery.isError) {
            return (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                    не загрузилось
                </span>
            );
        }
        const count = storesQuery.data?.length ?? 0;
        return (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-base-200 text-base-content/70 font-medium">
                {count}
            </span>
        );
    })();

    return (
        <>
            {/* Backdrop — только mobile bottom-sheet */}
            {open && (
                <div
                    className="lg:hidden fixed inset-0 z-20 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden
                />
            )}

            <aside
                className={`
                    fixed z-30 bg-base-100 shadow-xl border-base-content/10
                    transition-transform duration-300 ease-out
                    flex flex-col
                    lg:top-0 lg:left-0 lg:bottom-0 lg:w-[360px] lg:border-r
                    inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0)+4rem)] lg:bottom-0
                    max-h-[calc(80dvh-4rem)] lg:max-h-none
                    rounded-t-2xl border-t lg:rounded-none
                    ${open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:-translate-x-full'}
                `}
                aria-hidden={!open}
            >
                {/* Drag handle (mobile only) */}
                <div className="lg:hidden pt-2 pb-1 flex justify-center">
                    <span className="block w-12 h-1 rounded-full bg-base-content/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-base-content/10">
                    <div>
                        <h2 className="text-base font-bold text-base-content">Слои на карте</h2>
                        <p className="text-xs text-base-content/60 mt-0.5">
                            Москва и Подмосковье · 15 504 анализа
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="rounded-full p-1.5 hover:bg-base-200 text-base-content/70"
                    >
                        <XMarkIcon className="size-5" />
                    </button>
                </div>

                {/* Scroll content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Sticky pills + ViewMode — sticky relative to scroll-area
                        чтобы выбор параметра был всегда доступен при scroll'е
                        вниз. Виден только если heatmap on (иначе controls
                        не нужны). */}
                    {heatmapOn && (
                        <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm px-4 pt-3 pb-2 space-y-2 border-b border-base-content/5">
                            <ParamPills selected={selectedParam} onSelect={setSelectedParam} />
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <ViewModeToggle value={cellsViewMode} onChange={setCellsViewMode} />
                                <button
                                    type="button"
                                    onClick={() => setAllParamsOpen(true)}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    Все 22 параметра →
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="px-4 pb-4">
                        <Accordion
                            sectionKey="layers"
                            title="Слои на карте"
                            badge={String(layersCount)}
                            isOpen={layersOpen}
                            onToggle={(v) => setPanelSection('layers', v)}
                        >
                            <LayerToggleRow
                                label="Качество воды"
                                description="Тепловая карта по выбранному параметру"
                                checked={activeLayers.has('heatmap')}
                                onChange={(v) => setLayer('heatmap', v)}
                            />
                            <LayerToggleRow
                                label="Глубина скважин"
                                description="Карта горизонтов — для бурильщиков и копателей"
                                checked={activeLayers.has('depthMap')}
                                onChange={(v) => setLayer('depthMap', v)}
                            />
                            <LayerToggleRow
                                label="Отдельные анализы"
                                description="Появляются при увеличении масштаба"
                                checked={activeLayers.has('points')}
                                onChange={(v) => setLayer('points', v)}
                            />
                            <LayerToggleRow
                                label="Покрытие архива"
                                description="Плотность анализов — серая подложка поверх любого режима"
                                checked={activeLayers.has('coverage')}
                                onChange={(v) => setLayer('coverage', v)}
                            />
                            <LayerToggleRow
                                label="Точки продаж и приёма анализа"
                                description={
                                    pin
                                        ? 'Магазины Аквафор-Pro рядом с пином'
                                        : 'Поставьте пин, чтобы увидеть ближайшие магазины'
                                }
                                checked={activeLayers.has('stores')}
                                onChange={(v) => setLayer('stores', v)}
                                disabled={!pin}
                                accessory={storesAccessory}
                            />
                        </Accordion>

                        <Accordion
                            sectionKey="location"
                            title="Местоположение"
                            badge={pin ? '●' : '—'}
                            badgeVariant={pin ? 'primary' : 'muted'}
                            isOpen={locationOpen}
                            onToggle={(v) => setPanelSection('location', v)}
                        >
                            {pin ? (
                                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex items-start gap-2">
                                    <MapPinIcon className="size-4 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-base-content leading-tight">
                                            {pin.label ??
                                                `${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}`}
                                        </p>
                                        {pinSourceLabel && (
                                            <p className="text-[10px] text-base-content/55 leading-tight mt-0.5">
                                                {pinSourceLabel}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPin(null)}
                                        aria-label="Очистить пин"
                                        title="Очистить пин"
                                        className="rounded-full p-1 hover:bg-base-200 text-base-content/55 shrink-0"
                                    >
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-base-content/55 leading-snug">
                                    Пин не выбран. Выберите объект или используйте геолокацию.
                                </p>
                            )}

                            <RealEstatePicker />

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={requestGeolocation}
                                    className="btn btn-outline btn-primary btn-sm gap-1.5 normal-case"
                                >
                                    <span className="size-4 inline-block">
                                        <WaterDrop size={16} />
                                    </span>
                                    Геолокация
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPinPlacementMode(!pinPlacementMode);
                                        onClose();
                                    }}
                                    className={`btn btn-sm gap-1.5 normal-case ${
                                        pinPlacementMode ? 'btn-primary' : 'btn-outline btn-primary'
                                    }`}
                                >
                                    <MapPinIcon className="size-4" />
                                    {pinPlacementMode ? 'Отменить' : 'На карте'}
                                </button>
                            </div>
                        </Accordion>

                        <Accordion
                            sectionKey="analytics"
                            title="Аналитика по району"
                            isOpen={analyticsOpen}
                            onToggle={(v) => setPanelSection('analytics', v)}
                        >
                            <LayerToggleRow
                                label="Похожие анализы рядом"
                                description="Радиус от вашего адреса"
                                checked={similarOn}
                                onChange={setSimilarOn}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setAquiferStatsOpen(true);
                                    onClose();
                                }}
                                className="w-full text-left py-2.5 px-1 hover:bg-base-200/40 rounded-md transition"
                            >
                                <div className="text-sm font-medium text-base-content">
                                    Тип воды в районе →
                                </div>
                                <p className="text-xs text-base-content/60 mt-0.5 leading-snug">
                                    Распределение по 5 водоносным горизонтам и типичная химия
                                </p>
                            </button>
                        </Accordion>
                    </div>
                </div>
            </aside>

            <AllParamsModal
                isOpen={allParamsOpen}
                onClose={() => setAllParamsOpen(false)}
                selected={selectedParam}
                onSelect={setSelectedParam}
            />
        </>
    );
}

/**
 * Controlled accordion с header'ом title+badge и transition'ом chevron.
 * Состояние получает извне (через store), persist там же.
 */
function Accordion({
    sectionKey: _sectionKey,
    title,
    badge,
    badgeVariant = 'muted',
    isOpen,
    onToggle,
    children,
}: {
    sectionKey: TSectionKey;
    title: string;
    badge?: string;
    badgeVariant?: 'primary' | 'muted';
    isOpen: boolean;
    onToggle: (v: boolean) => void;
    children: React.ReactNode;
}) {
    const badgeCls =
        badgeVariant === 'primary'
            ? 'bg-primary/15 text-primary'
            : 'bg-base-200 text-base-content/65';
    return (
        <section className="mt-2 first:mt-3">
            <button
                type="button"
                onClick={() => onToggle(!isOpen)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-2 py-2 group"
            >
                <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/55">
                        {title}
                    </span>
                    {badge !== undefined && (
                        <span
                            className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-medium leading-none ${badgeCls}`}
                        >
                            {badge}
                        </span>
                    )}
                </span>
                <ChevronDownIcon
                    className={`size-4 text-base-content/50 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {isOpen && <div className="space-y-2 pb-1">{children}</div>}
        </section>
    );
}
