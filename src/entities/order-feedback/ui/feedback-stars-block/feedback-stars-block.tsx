import { FEEDBACK_STRUCTURE, type TFeedbackStructure } from '../../lib/feedback-structure';
import type { TParameters } from '../../model/types/t-order-feedback-parameters';

type TFeedbackStarsBlockProps = {
    structure?: TFeedbackStructure;
    parameters: TParameters;
    onChange?: (path: string[], value: number) => void;
    readonly?: boolean;
    path?: string[];
};

export function FeedbackStarsBlock({
    structure = FEEDBACK_STRUCTURE,
    parameters,
    onChange,
    readonly = false,
    path = [],
}: TFeedbackStarsBlockProps) {
    const getNumberSafe = (obj: TParameters, keys: string[]): number | null => {
        let val: unknown = obj;
        for (const key of keys) {
            if (typeof val !== 'object' || val === null) return null;
            val = (val as Record<string, unknown>)[key];
        }
        return typeof val === 'number' ? val : null;
    };

    const renderStars = (fullPath: string[], value: number) => (
        <div className="rating rating-sm">
            {Array.from({ length: 5 }).map((_, idx) => (
                <input
                    key={idx}
                    type="radio"
                    name={fullPath.join('.')}
                    className="mask mask-star-2 bg-yellow-400"
                    checked={value === idx + 1}
                    disabled={readonly}
                    onChange={readonly || !onChange ? undefined : () => onChange(fullPath, idx + 1)}
                />
            ))}
        </div>
    );

    return (
        <>
            {structure.map((item) => {
                const fullPath = [...path, item.key];
                if (item.children) {
                    return (
                        <div key={item.key} className="bg-base-200 p-4 mb-2 rounded-xl shadow">
                            <div className="font-semibold mb-1">{item.label}</div>
                            <div className="flex flex-col gap-1">
                                {item.children.map((child) => {
                                    const childPath = [...fullPath, child.key];
                                    const value = getNumberSafe(parameters, childPath) ?? 0;
                                    return (
                                        <div
                                            key={child.key}
                                            className="flex items-center gap-2 px-1"
                                        >
                                            <div className="w-44 text-sm">{child.label}</div>
                                            {renderStars(childPath, value)}
                                            <span className="ml-2 text-xs text-base-content/60">
                                                {value > 0 ? value : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }
                const value = getNumberSafe(parameters, fullPath) ?? 0;
                return (
                    <div key={item.key} className="flex items-center gap-2 py-1">
                        <div className="w-44 text-sm">{item.label}</div>
                        {renderStars(fullPath, value)}
                        <span className="ml-2 text-xs text-base-content/60">
                            {value > 0 ? value : '—'}
                        </span>
                    </div>
                );
            })}
        </>
    );
}
