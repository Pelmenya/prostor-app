export type TWizardStepProps = {
    onNext?: () => void;
    onPrev?: () => void;
    onCancel: () => void;
    editMode?: boolean;
    id?: string;
};
