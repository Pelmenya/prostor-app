import type { TUser } from '@/shared/model';
import type { TParameters } from './t-order-feedback-parameters';

export type TOrderFeedback = {
    id: string;
    order: { id: number };
    author: TUser;
    executor: TUser;
    clientParameters: TParameters;
    internalParameters?: TParameters;
    comment?: string | null;
    createdAt: string;
};
