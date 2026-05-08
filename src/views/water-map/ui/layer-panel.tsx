'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useWaterMapStore } from '../model';
import { AllParamsModal } from './all-params-modal';
import { LayerToggleRow } from './layer-toggle-row';
import { ParamPills } from './param-pills';
import { ViewModeToggle } from './view-mode-toggle';

type TLayerPanelProps = {
    open: boolean;
    onClose: () => void;
};

/**
 * Панель управления слоями. Адаптивная:
 *  - mobile (<lg): bottom-sheet (slide-up снизу)
 *  - lg+: sidebar слева 360px (всегда виден когда open=true)
 *
 * 2 секции:
 *  - LAYERS — heatmap (с pills параметра)
 *  - АНАЛИТИКА — depth-map, points (high-zoom), aquifer-stats, similar
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
    const [allParamsOpen, setAllParamsOpen] = useState(false);

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
                    inset-x-0 bottom-0 max-h-[80dvh] rounded-t-2xl border-t lg:rounded-none
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
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <section className="pt-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 mb-1">
                            Слои
                        </h3>
                        <LayerToggleRow
                            label="Качество воды"
                            description="Тепловая карта по выбранному параметру"
                            checked={activeLayers.has('heatmap')}
                            onChange={(v) => setLayer('heatmap', v)}
                        />
                        {activeLayers.has('heatmap') && (
                            <div className="px-1 pb-2 space-y-2">
                                <ParamPills selected={selectedParam} onSelect={setSelectedParam} />
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <ViewModeToggle
                                        value={cellsViewMode}
                                        onChange={setCellsViewMode}
                                    />
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
                    </section>

                    <section className="pt-4 mt-2 border-t border-base-content/10">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 mb-1">
                            Аналитика по району
                        </h3>
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
                    </section>
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
