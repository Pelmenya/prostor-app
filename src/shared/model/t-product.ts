import type { TGroupPath } from './t-group';

export type TCurrency = {
    meta: {
        href: string;
        type: string;
    };
    name?: string;
};

export type TPrice = {
    meta: {
        href: string;
        type: string;
    };
    id?: string;
    name?: string;
};

export type TSalePrice = {
    value: number;
    currency: TCurrency;
    priceType: TPrice;
};

/** Значение ссылочного атрибута МойСклад (тип entity, bundle и т.п.) */
export type TAttributeLinkedValue = {
    meta: { href: string; type: string };
    id?: string;
    name: string;
};

export type TAttribute = {
    meta: {
        href: string;
        type: string;
    };
    id?: string;
    name: string;
    type: string;
    value: boolean | string | number | TAttributeLinkedValue | null;
};

export enum EServiceCategory {
    MONTAZH = 'Монтаж',
    SERVISNOE_OBSLUZHIVANIE = 'Сервисное обслуживание',
}

export type TService = {
    id: string;
    name: string;
    description?: string;
    category?: EServiceCategory;
    rateOfHours?: number;
    salePrices?: TSalePrice[];
};

export type TProductImage = {
    filename: string;
    downloadHref: string;
    miniatureHref?: string;
    tinyHref?: string;
};

export type TImage = {
    meta: {
        downloadHref: string;
    };
    title: string;
    filename: string;
    miniature: {
        downloadHref: string;
    };
};

export type TProduct = {
    id: string;
    name: string;
    description?: string;
    attributes: TAttribute[];
    salePrices?: TSalePrice[];
    services?: TService[];
    images?: TProductImage[];
    groupPath?: TGroupPath[];
    archived?: boolean;
};
