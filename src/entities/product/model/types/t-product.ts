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

export type TAttribute = {
    meta: {
        href: string;
        type: string;
    };
    id?: string;
    name: string;
    type: string;
    value: boolean | string | number;
};

export enum EServiceCategory {
    MONTAZH = 'MONTAZH',
    SERVISNOE_OBSLUZHIVANIE = 'SERVISNOE_OBSLUZHIVANIE',
}

export type TService = {
    id: string;
    name: string;
    description?: string;
    category: EServiceCategory;
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
    archived?: boolean;
};
