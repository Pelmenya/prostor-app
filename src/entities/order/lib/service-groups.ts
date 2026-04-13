import { EServiceCategory } from '@/shared/model';

export const SERVICE_GROUPS = [
    { category: EServiceCategory.MONTAZH, variant: 'installation' as const },
    { category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE, variant: 'maintenance' as const },
    { category: undefined, variant: 'service' as const },
] as const;
