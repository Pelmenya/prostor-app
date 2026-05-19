'use client';

import { type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateServiceSetup, accountServiceKeys } from '@/entities/account-service';
import { MASTER_PATH, MASTER_SETTINGS_PATH } from '@/shared/config';

const STEP_LABELS = ['Профиль', 'Локация', 'Авто', 'Зоны', 'График'] as const;
const TOTAL_STEPS = STEP_LABELS.length;

type TServiceSettingsWizardProps = {
    onBeforeNext: () => Promise<boolean>;
    children: ReactNode;
};

export function ServiceSettingsWizard({ onBeforeNext, children }: TServiceSettingsWizardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { mutateAsync: updateSetup, isPending } = useUpdateServiceSetup();

    const currentStep = Math.max(
        1,
        Math.min(TOTAL_STEPS, parseInt(searchParams.get('step') ?? '1', 10)),
    );
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === TOTAL_STEPS;

    async function handleNext() {
        const canProceed = await onBeforeNext();
        if (!canProceed) return;

        if (isLastStep) {
            try {
                const updated = await updateSetup({ completed: true, currentStep });
                queryClient.setQueryData(accountServiceKeys.my(), updated);
                router.replace(MASTER_PATH);
            } catch {
                // error handled by step forms
            }
        } else {
            router.push(`${MASTER_SETTINGS_PATH}?step=${currentStep + 1}`);
        }
    }

    function handleBack() {
        router.push(`${MASTER_SETTINGS_PATH}?step=${currentStep - 1}`);
    }

    return (
        <div className="flex flex-col min-h-dvh">
            <div className="px-4 pt-6 pb-2">
                <ol
                    aria-label="Прогресс настройки профиля"
                    className="steps steps-horizontal w-full"
                >
                    {STEP_LABELS.map((label, i) => (
                        <li
                            key={label}
                            aria-current={i + 1 === currentStep ? 'step' : undefined}
                            className={`step text-xs ${i < currentStep ? 'step-primary' : ''}`}
                        >
                            {label}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex-1 overflow-y-auto p-4">{children}</div>

            <div className="p-4 bg-base-100 border-t border-base-300 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {isFirstStep ? (
                    <button
                        type="button"
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
                            type="button"
                            className="btn btn-outline flex-1"
                            onClick={handleBack}
                            disabled={isPending}
                        >
                            Назад
                        </button>
                        <button
                            type="button"
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
