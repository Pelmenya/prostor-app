'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { TWaterParam } from '@/entities/water-analysis';
import { paramsByCategory, WATER_PARAM_CATEGORIES, WATER_PARAM_META } from '../lib';

type TAllParamsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    selected: TWaterParam;
    onSelect: (p: TWaterParam) => void;
};

/**
 * Modal со всеми 22 параметрами + 2 synthetic composites (Risk и Все проблемы).
 *
 * Layout:
 *  - 2 highlight tile сверху (Risk + Все проблемы, equal-width row)
 *  - 4 секции с категориями СанПиН
 *
 * Mobile: full-screen sheet (height 100dvh) — для удобной вертикальной навигации
 * по 22+ карточкам без сжатия в 85vh-окне.
 * Desktop: centered modal (max-w-2xl + max-h-85vh) — карточкам комфортно в гриде 3×N.
 *
 * Не используем shared BottomSheetModal потому что нужен mobile-fullscreen
 * variant — у того компонента жёстко max-h-[85vh].
 */
export function AllParamsModal({ isOpen, onClose, selected, onSelect }: TAllParamsModalProps) {
    const handleSelect = (p: TWaterParam) => {
        onSelect(p);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 transition duration-200 ease-out data-closed:opacity-0"
            />
            <div className="fixed inset-0 flex items-end sm:items-center sm:justify-center sm:p-4">
                <DialogPanel
                    transition
                    className="
                        flex flex-col w-full bg-base-100
                        h-[100dvh] sm:max-h-[85vh] sm:h-auto sm:max-w-2xl sm:rounded-2xl
                        transition duration-200 ease-out
                        data-closed:translate-y-full
                        sm:data-closed:translate-y-0 sm:data-closed:scale-95 sm:data-closed:opacity-0
                    "
                >
                    <header className="shrink-0 flex items-center justify-between p-4 border-b border-base-300">
                        <DialogTitle as="h3" className="font-bold text-lg leading-6">
                            Все параметры воды
                        </DialogTitle>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-square -mr-1"
                            aria-label="Закрыть"
                            onClick={onClose}
                        >
                            <XMarkIcon className="size-5" />
                        </button>
                    </header>

                    <div
                        className="overflow-y-auto flex flex-col gap-4 p-4"
                        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                    >
                        {/* 2 highlight tile рядом — quick-pick synthetic'ов */}
                        <div className="grid grid-cols-2 gap-2">
                            <SyntheticTile
                                code="risk"
                                emoji="⚖"
                                description="Жёсткость + железо + марганец + минерализация"
                                active={selected === 'risk'}
                                onClick={() => handleSelect('risk')}
                            />
                            <SyntheticTile
                                code="all_problems"
                                emoji="⚠"
                                description="Хотя бы один параметр СанПиН превышен"
                                active={selected === 'all_problems'}
                                onClick={() => handleSelect('all_problems')}
                            />
                        </div>

                        {WATER_PARAM_CATEGORIES.map((cat) => {
                            const params = paramsByCategory(cat.id);
                            if (!params.length) return null;
                            return (
                                <section key={cat.id}>
                                    <header className="mb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                                            {cat.label} · {params.length}
                                        </h3>
                                        {cat.description && (
                                            <p className="text-[11px] text-base-content/50 leading-snug mt-0.5">
                                                {cat.description}
                                            </p>
                                        )}
                                    </header>
                                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {params.map((p) => (
                                            <li key={p.code}>
                                                <ParamCard
                                                    active={selected === p.code}
                                                    onClick={() => handleSelect(p.code)}
                                                    title={p.label}
                                                    subtitle={formatPdkLine(p)}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            );
                        })}

                        <p className="text-[10px] text-base-content/40 leading-snug pt-1">
                            Источник нормативов — СанПиН 1.2.3685-21. Параметры без ПДК
                            (температура, электропроводность) показываем как справочные.
                        </p>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

type TParamCardProps = {
    active: boolean;
    onClick: () => void;
    title: string;
    subtitle: string;
};

function ParamCard({ active, onClick, title, subtitle }: TParamCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                active
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-base-100 border-base-content/10 text-base-content hover:border-primary/40'
            }`}
        >
            <div className="text-sm font-medium leading-tight truncate">{title}</div>
            <div className="text-[11px] text-base-content/55 leading-tight mt-0.5 truncate">
                {subtitle}
            </div>
        </button>
    );
}

function SyntheticTile({
    code,
    emoji,
    description,
    active,
    onClick,
}: {
    code: TWaterParam;
    emoji: string;
    description: string;
    active: boolean;
    onClick: () => void;
}) {
    const meta = WATER_PARAM_META[code];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left rounded-xl border px-3 py-2.5 transition flex items-center gap-2.5 ${
                active
                    ? 'bg-primary text-primary-content border-primary'
                    : 'bg-primary/5 border-primary/30 text-base-content hover:bg-primary/10'
            }`}
        >
            <div
                className={`size-9 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                    active ? 'bg-primary-content/20' : 'bg-primary/20'
                }`}
            >
                {emoji}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold leading-tight truncate">{meta.label}</div>
                <div
                    className={`text-[11px] leading-tight mt-0.5 line-clamp-2 ${
                        active ? 'opacity-90' : 'text-base-content/60'
                    }`}
                >
                    {description}
                </div>
            </div>
        </button>
    );
}

function formatPdkLine(meta: {
    pdk: number | { min: number; max: number } | null;
    unit: string;
}): string {
    const u = meta.unit ? ` ${meta.unit}` : '';
    if (meta.pdk === null) return 'Не нормируется';
    if (typeof meta.pdk === 'number') return `ПДК: ${meta.pdk}${u}`;
    return `ПДК: ${meta.pdk.min}–${meta.pdk.max}${u}`;
}
