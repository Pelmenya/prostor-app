import type { TParameters } from '../model/types/t-order-feedback-parameters';
import type { TFeedbackStructure } from './feedback-structure';

export function getDefaultParams(structure: TFeedbackStructure): TParameters {
    const obj: TParameters = {};
    for (const item of structure) {
        if (item.children) {
            obj[item.key] = {};
            for (const child of item.children) {
                (obj[item.key] as TParameters)[child.key] = 0;
            }
        } else {
            obj[item.key] = 0;
        }
    }
    return obj;
}
