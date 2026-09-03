import {
    HomeModernIcon,
    BuildingOffice2Icon,
    BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import type { TRealEstateType } from '@/shared/model';

export const TYPE_ICONS: Record<TRealEstateType, typeof HomeModernIcon> = {
    house: HomeModernIcon,
    apartment: BuildingOffice2Icon,
    prom: BuildingLibraryIcon,
};
