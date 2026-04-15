import { FEEDBACK_STRUCTURE } from './feedback-structure';

const labelsMap = new Map<string, string>();

for (const cat of FEEDBACK_STRUCTURE) {
    labelsMap.set(cat.key, cat.label);
    if (cat.children) {
        for (const child of cat.children) {
            labelsMap.set(`${cat.key}.${child.key}`, child.label);
        }
    }
}

export const getFeedbackLabel = (catKey: string, critKey?: string): string => {
    if (critKey) return labelsMap.get(`${catKey}.${critKey}`) ?? critKey;
    return labelsMap.get(catKey) ?? catKey;
};
