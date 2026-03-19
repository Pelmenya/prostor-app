export type TSystemBundle = {
    id?: string;
    name?: string;
    description?: string;
    image?: {
        downloadHref?: string;
        miniatureHref?: string;
    };
};

export type TGroup = {
    id: string;
    parentGroupName: string | null;
    groupName: string | null;
    shouldDisplay: boolean;
    systemBundle: TSystemBundle;
    minPrice?: number;
};

export type TGroupPath = {
    id: string;
    groupName: string | null;
    parentGroupName: string | null;
    shouldDisplay: boolean;
};
