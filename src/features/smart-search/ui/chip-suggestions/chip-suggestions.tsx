'use client';

import type { ComponentType } from 'react';
import { CameraIcon, MapPinIcon, WrenchIcon } from '@heroicons/react/24/outline';
import { ArticleDotsIcon, WaterDrop } from '@/shared/ui';
import type { TSmartSearchChipKind } from '../../model/types';

/**
 * Idle-state chip-suggestions (4 базовых + 5-й «По адресу» мигрирует
 * RealEstatePicker flow из FTUX hint card). Клик по chip → prefill query
 * + focus input. Address chip — особый kind, открывает address-picker flow.
 *
 * Slovo feedback 2026-05-17 11:25: native OS emoji рендерятся непредсказуемо
 * cross-platform (на macOS «📰» рендерилась как «📺 TV»). Перешли на
 * Heroicons + наш WaterDrop SVG — детерминированный рендер на всех системах.
 */

type TIconComponent = ComponentType<{ className?: string }>;

// WaterDrop filled (brand-mark с gradient + sparkle) — единый visual язык
// со SimilarFab и hero/sticky-input в smart-search. Не outline — Дима
// явно указал на FAB-каплю (2026-05-18 12:14) как референс. Wrapper
// нормализует signature под Heroicons-like (className-only).
const DropIcon: TIconComponent = ({ className }) => (
    <span className={className}>
        <WaterDrop />
    </span>
);

type TChip = {
    kind: TSmartSearchChipKind;
    label: string;
    Icon: TIconComponent;
    placeholder: string;
};

const CHIPS: TChip[] = [
    {
        kind: 'photo',
        label: 'Фото товара',
        Icon: CameraIcon,
        placeholder: 'Сфотографируйте фильтр или коробку',
    },
    {
        kind: 'article',
        label: 'По артикулу',
        // ArticleDotsIcon — кастомный SVG из design uplift 2026-05-18.
        // Slovo iter2 feedback: HashtagIcon (#) был placeholder; дизайнер
        // выдал dot-matrix glyph для article/SKU контекста.
        Icon: ArticleDotsIcon,
        placeholder: 'Например: Аквафор DWM-101S',
    },
    {
        kind: 'problem',
        label: 'Проблема с водой',
        Icon: DropIcon,
        placeholder: 'Например: жёсткая вода, привкус железа',
    },
    {
        kind: 'install',
        label: 'Установка / монтаж',
        Icon: WrenchIcon,
        placeholder: 'Например: установка фильтра под мойку',
    },
    {
        kind: 'address',
        label: 'По адресу',
        Icon: MapPinIcon,
        placeholder: 'Прогноз химии воды для вашего адреса',
    },
];

type TProps = {
    onPick: (chip: { kind: TSmartSearchChipKind; placeholder: string }) => void;
};

export function ChipSuggestions({ onPick }: TProps) {
    return (
        <section aria-label="Подсказки для поиска">
            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
                С чего начать
            </h4>
            <ul className="flex flex-wrap gap-2">
                {CHIPS.map(({ kind, label, Icon, placeholder }) => (
                    <li key={kind}>
                        <button
                            type="button"
                            onClick={() => onPick({ kind, placeholder })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-base-200 hover:bg-base-300 text-sm text-base-content/85 transition cursor-pointer"
                        >
                            <Icon className="size-4 text-primary shrink-0" aria-hidden="true" />
                            <span>{label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
