export type TFeedbackParameterLeaf = {
    key: string;
    label: string;
};

export type TFeedbackParameterNode = {
    key: string;
    label: string;
    children: TFeedbackParameterLeaf[] | null;
};

export type TFeedbackStructure = TFeedbackParameterNode[];

export const FEEDBACK_STRUCTURE: TFeedbackStructure = [
    {
        key: 'quality',
        label: 'Качество',
        children: [
            { key: 'politeness', label: 'Вежливость' },
            { key: 'accuracy', label: 'Аккуратность' },
            { key: 'shoeChange', label: 'Сменная обувь' },
            { key: 'appearance', label: 'Внешний вид' },
        ],
    },
    {
        key: 'competence',
        label: 'Профессиональные компетенции',
        children: [
            { key: 'taskUnderstanding', label: 'Понимание задач' },
            { key: 'productKnowledge', label: 'Знание продукта' },
            { key: 'explanation', label: 'Разъяснение работы оборудования и обслуживания' },
            { key: 'troubleshooting', label: 'Устранение неполадок на месте' },
        ],
    },
    {
        key: 'speed',
        label: 'Скорость',
        children: [
            { key: 'punctuality', label: 'Дисциплина/начало вовремя' },
            { key: 'normHours', label: 'Выполнение в рамках нормативных часов' },
        ],
    },
];
