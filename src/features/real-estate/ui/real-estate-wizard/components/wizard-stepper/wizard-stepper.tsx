const STEPS = ['Объект', 'Адрес', 'Водоразбор'];

type TWizardStepperProps = {
    current: number; // 1-based
};

export function WizardStepper({ current }: TWizardStepperProps) {
    return (
        <ul className="steps w-full">
            {STEPS.map((label, idx) => {
                const num = idx + 1;
                return (
                    <li
                        key={label}
                        className={`step text-xs ${num <= current ? 'step-primary' : ''}`}
                    >
                        {label}
                    </li>
                );
            })}
        </ul>
    );
}
