export type TWizardStepProps = {
    onNext?: () => void;
    onPrev?: () => void;
    onCancel: () => void;
    onSuccess?: (newId: number) => void;
    editMode?: boolean;
    id?: string;
};
