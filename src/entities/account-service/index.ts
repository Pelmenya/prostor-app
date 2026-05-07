export {
    useAccountService,
    useAccountServiceQuery,
    useUpdateAccountService,
    useUpdateServiceSetup,
    useGetWorkDays,
    accountServiceKeys,
} from './api/account-service.api';
export type { TUpdateAccountService } from './model/t-update-account-service';

export type { TAccountService } from './model/t-account-service';
export type { TServiceSetup } from './model/t-service-setup';
export { EDepartureBasis } from './model/e-departure-basis';
export { EServiceGrade } from './model/e-service-grade';
export { EMasterSpecialization } from './model/e-master-specialization';

export { getGradeLabel } from './lib/get-grade-label';
export { getCategoryLabel } from './lib/get-category-label';
export { getCategoriesByGrade } from './lib/get-categories-by-grade';
export { getDepartureBasisLabel } from './lib/get-departure-basis-label';
