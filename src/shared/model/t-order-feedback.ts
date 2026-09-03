import type { TUser } from './t-user';
import type { TOrderFeedbackParameters } from './t-order-feedback-parameters';

export type TOrderFeedback = {
    id: string;
    order: { id: number };
    author: TUser;
    executor: TUser;
    clientParameters: TOrderFeedbackParameters;
    internalParameters?: TOrderFeedbackParameters;
    comment?: string | null;
    createdAt: string;
};
