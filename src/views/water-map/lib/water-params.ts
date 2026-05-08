import type { TWaterParam } from '@/entities/water-analysis';

/**
 * UI metadata для 22 canonical paramCode + risk. Источник цифр ПДК — СанПиН 1.2.3685-21
 * (через slovo `@slovo/water-blank-extraction` справочник). Дублируется здесь чтобы
 * UI не зависел от backend response.
 *
 * Категории — для группировки в all-params modal:
 *  - `organoleptic` — органолептические (3): odor, color, turbidity
 *  - `general` — обобщённые (4): tds, hardness_total, permanganate_oxidizability, ph
 *  - `inorganic` — неорганические (12): ammonium, iron_total, manganese, magnesium,
 *    calcium, nitrates, nitrites, sulfates, sulfides, chlorides, fluorides, hydrogen_sulfide
 *  - `physical` — физические без ПДК (3): alkalinity_total, temperature, electrical_conductivity
 *    (alkalinity нормируется но физическая характеристика — отношу сюда для UI группировки)
 *  - `synthetic` — synthetic risk (1): risk
 *
 * Источник группировки: docs/feedback/water-map-thread.md (slovo-claude по
 * sanpin-1-2-3685-21-v1.0.0.ts).
 */
export type TWaterParamCategory =
    | 'organoleptic'
    | 'general'
    | 'inorganic'
    | 'physical'
    | 'synthetic';

export type TWaterParamMeta = {
    code: TWaterParam;
    label: string;
    fullLabel: string;
    unit: string;
    pdk: number | { min: number; max: number } | null;
    category: TWaterParamCategory;
};

export const WATER_PARAM_META: Record<TWaterParam, TWaterParamMeta> = {
    odor: {
        code: 'odor',
        label: 'Запах',
        fullLabel: 'Запах',
        unit: 'балл',
        pdk: 2,
        category: 'organoleptic',
    },
    color: {
        code: 'color',
        label: 'Цветность',
        fullLabel: 'Цветность',
        unit: 'град',
        pdk: 20,
        category: 'organoleptic',
    },
    turbidity: {
        code: 'turbidity',
        label: 'Мутность',
        fullLabel: 'Мутность',
        unit: 'мг/л',
        pdk: 1.5,
        category: 'organoleptic',
    },
    tds: {
        code: 'tds',
        label: 'Минерализация',
        fullLabel: 'TDS / общее солесодержание',
        unit: 'мг/л',
        pdk: 1000,
        category: 'general',
    },
    hardness_total: {
        code: 'hardness_total',
        label: 'Жёсткость',
        fullLabel: 'Жёсткость общая',
        unit: 'мг-экв/л',
        pdk: 7,
        category: 'general',
    },
    permanganate_oxidizability: {
        code: 'permanganate_oxidizability',
        label: 'Окисляемость',
        fullLabel: 'Перманганатная окисляемость',
        unit: 'мг О/л',
        pdk: 5,
        category: 'general',
    },
    ph: {
        code: 'ph',
        label: 'pH',
        fullLabel: 'Водородный показатель',
        unit: '',
        pdk: { min: 6, max: 9 },
        category: 'general',
    },
    ammonium: {
        code: 'ammonium',
        label: 'Аммоний',
        fullLabel: 'Аммоний (NH₄⁺)',
        unit: 'мг/л',
        pdk: 1.5,
        category: 'inorganic',
    },
    iron_total: {
        code: 'iron_total',
        label: 'Железо',
        fullLabel: 'Железо (Fe, суммарно)',
        unit: 'мг/л',
        pdk: 0.3,
        category: 'inorganic',
    },
    manganese: {
        code: 'manganese',
        label: 'Марганец',
        fullLabel: 'Марганец (Mn)',
        unit: 'мг/л',
        pdk: 0.1,
        category: 'inorganic',
    },
    magnesium: {
        code: 'magnesium',
        label: 'Магний',
        fullLabel: 'Магний (Mg)',
        unit: 'мг/л',
        pdk: 50,
        category: 'inorganic',
    },
    calcium: {
        code: 'calcium',
        label: 'Кальций',
        fullLabel: 'Кальций (Ca)',
        unit: 'мг/л',
        pdk: 130,
        category: 'inorganic',
    },
    nitrates: {
        code: 'nitrates',
        label: 'Нитраты',
        fullLabel: 'Нитраты (NO₃⁻)',
        unit: 'мг/л',
        pdk: 45,
        category: 'inorganic',
    },
    nitrites: {
        code: 'nitrites',
        label: 'Нитриты',
        fullLabel: 'Нитриты (NO₂⁻)',
        unit: 'мг/л',
        pdk: 3,
        category: 'inorganic',
    },
    sulfates: {
        code: 'sulfates',
        label: 'Сульфаты',
        fullLabel: 'Сульфаты (SO₄²⁻)',
        unit: 'мг/л',
        pdk: 500,
        category: 'inorganic',
    },
    sulfides: {
        code: 'sulfides',
        label: 'Сульфиды',
        fullLabel: 'Сульфиды (S²⁻)',
        unit: 'мг/л',
        pdk: 0.03,
        category: 'inorganic',
    },
    chlorides: {
        code: 'chlorides',
        label: 'Хлориды',
        fullLabel: 'Хлориды (Cl⁻)',
        unit: 'мг/л',
        pdk: 350,
        category: 'inorganic',
    },
    fluorides: {
        code: 'fluorides',
        label: 'Фториды',
        fullLabel: 'Фториды (F⁻)',
        unit: 'мг/л',
        pdk: 1.5,
        category: 'inorganic',
    },
    hydrogen_sulfide: {
        code: 'hydrogen_sulfide',
        label: 'Сероводород',
        fullLabel: 'Сероводород (H₂S)',
        unit: 'мг/л',
        pdk: 0.03,
        category: 'inorganic',
    },
    alkalinity_total: {
        code: 'alkalinity_total',
        label: 'Щёлочность',
        fullLabel: 'Щёлочность общая',
        unit: 'мг-экв/л',
        pdk: 6.5,
        category: 'general',
    },
    temperature: {
        code: 'temperature',
        label: 'Температура',
        fullLabel: 'Температура',
        unit: '°C',
        pdk: null,
        category: 'physical',
    },
    electrical_conductivity: {
        code: 'electrical_conductivity',
        label: 'Электропроводность',
        fullLabel: 'Удельная электропроводность',
        unit: 'мкСм/см',
        pdk: null,
        category: 'physical',
    },
    risk: {
        code: 'risk',
        label: 'Индекс риска',
        fullLabel: 'Индекс риска (% от ПДК по 4 ключевым параметрам)',
        unit: '',
        pdk: 50,
        category: 'synthetic',
    },
    // OR-aggregation по 19 regulated params СанПиН — % rows где хотя бы
    // один param > ПДК. Дает overview «есть ли вообще проблема в районе».
    all_problems: {
        code: 'all_problems',
        label: 'Все проблемы',
        fullLabel: 'Все проблемы (хотя бы один параметр СанПиН)',
        unit: '',
        pdk: 30,
        category: 'synthetic',
    },
};

/**
 * Список категорий с UI-лейблами для секций modal'а.
 */
export const WATER_PARAM_CATEGORIES: ReadonlyArray<{
    id: TWaterParamCategory;
    label: string;
    description?: string;
}> = [
    { id: 'organoleptic', label: 'Органолептические', description: 'Запах, цвет, мутность' },
    { id: 'general', label: 'Обобщённые', description: 'Минерализация, жёсткость, pH, щёлочность' },
    { id: 'inorganic', label: 'Неорганические', description: 'Металлы и анионы' },
    { id: 'physical', label: 'Физические', description: 'Не нормируется СанПиН' },
];

/**
 * Format value + unit. Risk → 0-100 без единиц.
 */
export function formatParamValue(code: string, value: number): string {
    const meta = WATER_PARAM_META[code as TWaterParam];
    const unit = meta?.unit ? ` ${meta.unit}` : '';
    const precision =
        Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : Math.abs(value) >= 1 ? 2 : 3;
    return `${value.toFixed(precision)}${unit}`;
}

export function paramLabel(code: string): string {
    return WATER_PARAM_META[code as TWaterParam]?.label ?? code;
}

export function paramFullLabel(code: string): string {
    return WATER_PARAM_META[code as TWaterParam]?.fullLabel ?? code;
}

/**
 * Все 22 paramCode (без synthetic risk) сгруппированы по категории.
 * Используется в all-params modal для grouped grid'а.
 */
export function paramsByCategory(category: TWaterParamCategory): TWaterParamMeta[] {
    return Object.values(WATER_PARAM_META).filter((m) => m.category === category);
}
