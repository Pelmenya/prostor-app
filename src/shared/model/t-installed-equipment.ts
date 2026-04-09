export type TInstalledComponent = {
    id: string;
    msProductId: string;
    componentName: string;
    baseLifespanMonths: number;
    adjustedLifespanMonths: number;
    installedAt: string;
    nextReplacementDate: string;
    isReplaced: boolean;
    replacedAt?: string | null;
    equipment?: {
        id: string;
        productName: string;
        realEstate?: { id: number; address?: string };
    };
};

export type TInstalledEquipment = {
    id: string;
    msProductId: string;
    productName: string;
    installedAt: string;
    isActive: boolean;
    notificationsEnabled: boolean;
    order?: { id: string } | null;
    realEstate?: { id: number } | null;
    components: TInstalledComponent[];
};

export type TCreateInstalledEquipment = {
    realEstateId: number;
    msProductId: string;
    installedAt?: string;
};
