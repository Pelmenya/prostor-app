import type { TOrderFeedbackParameters } from '@/shared/model';
import type {
    TFeedbackStructure,
    TFeedbackParameterNode,
    TFeedbackParameterLeaf,
} from './feedback-structure';

export function allStarsSelected(
    obj: TOrderFeedbackParameters,
    structure: TFeedbackStructure,
    excludeKeys: string[] = [],
): boolean {
    return structure.every((section: TFeedbackParameterNode) => {
        if (excludeKeys.includes(section.key)) return true;

        if (section.children) {
            const sectionValue = obj[section.key];
            if (!sectionValue || typeof sectionValue !== 'object') return false;
            return section.children.every(
                (child: TFeedbackParameterLeaf) =>
                    typeof (sectionValue as Record<string, unknown>)[child.key] === 'number' &&
                    (sectionValue as Record<string, number>)[child.key] > 0,
            );
        } else {
            return typeof obj[section.key] === 'number' && (obj[section.key] as number) > 0;
        }
    });
}
