'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateServiceSetup } from '@/entities/account-service';

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Профиль', 'Локация', 'Авто', 'Зоны', 'График'];

type TServiceSettingsWizardProps = {
    currentStep: number;
    onBeforeNext: () => Promise<boolean>;
    children: ReactNode;
};

export function ServiceSettingsWizard({
    currentStep,
    onBeforeNext,
    children,
}: TServiceSettingsWizardProps) {
    const router = useRouter();
    const { mutateAsync: updateSetup, isPending } = useUpdateServiceSetup();
    const [error, setError] = useState<string | null>(null);

    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === TOTAL_STEPS;

    async function handleNext() {
        setError(null);
        try {
            const canProceed = await onBeforeNext();
            if (!canProceed) return;

            if (isLastStep) {
                await updateSetup({ currentStep: TOTAL_STEPS, completed: true });
                router.replace('/dashboard/master');
            } else {
                await updateSetup({ currentStep: currentStep + 1 });
            }
        } catch {
            setError('Не удалось сохранить. Попробуйте ещё раз.');
        }
    }

    async function handleBack() {
        setError(null);
        try {
            await updateSetup({ currentStep: currentStep - 1 });
        } catch {
            setError('Ошибка. Попробуйте ещё раз.');
        }
    }

    return (
        <div className="flex flex-col min-h-dvh">
            <div className="px-4 pt-6 pb-2">
                <ul className="steps steps-horizontal w-full">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <li
                            key={i}
                            className={`step text-xs ${i < currentStep ? 'step-primary' : ''}`}
                        >
                            {STEP_LABELS[i]}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex-1 overflow-y-auto p-4">{children}</div>

            {error && (
                <div className="px-4">
                    <p className="text-error text-sm text-center">{error}</p>
                </div>
            )}

            <div className="p-4 bg-base-100 border-t border-base-300 safe-area-bottom">
                {isFirstStep ? (
                    <button
                        className="btn btn-primary w-full"
                        onClick={handleNext}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : (
                            'Далее'
                        )}
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            className="btn btn-outline flex-1"
                            onClick={handleBack}
                            disabled={isPending}
                        >
                            Назад
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={handleNext}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : isLastStep ? (
                                'Завершить'
                            ) : (
                                'Далее'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
