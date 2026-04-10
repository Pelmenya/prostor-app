'use client';

import type { ReactNode } from 'react';

type TWizardStepLayoutProps = {
    children: ReactNode;
    onBack: () => void;
    backLabel?: string;
    onForward: () => void;
    forwardLabel?: ReactNode;
    forwardDisabled?: boolean;
};

export function WizardStepLayout({
    children,
    onBack,
    backLabel = 'Назад',
    onForward,
    forwardLabel = 'Далее',
    forwardDisabled = false,
}: TWizardStepLayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            {children}
            <div className="flex gap-2">
                <button type="button" className="btn btn-outline flex-1" onClick={onBack}>
                    {backLabel}
                </button>
                <button
                    type="button"
                    className="btn btn-primary flex-1"
                    onClick={onForward}
                    disabled={forwardDisabled}
                >
                    {forwardLabel}
                </button>
            </div>
        </div>
    );
}
