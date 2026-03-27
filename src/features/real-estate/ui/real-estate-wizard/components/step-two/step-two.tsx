'use client';

import { FC, useEffect, type ReactNode } from 'react';
import { useRealEstateWizardStore } from '../../../../model/real-estate-wizard.store';
import type { TWizardStepProps } from '../../types/t-wizard-step-props';

type TStepTwoProps = TWizardStepProps & {
    addressSearchSlot: ReactNode;
};

export const StepTwo: FC<TStepTwoProps> = ({
    onNext,
    onPrev,
    editMode,
    onCancel,
    addressSearchSlot,
}) => {
    const address = useRealEstateWizardStore((s) => s.address);
    const coordinates = useRealEstateWizardStore((s) => s.coordinates);
    const setProgress = useRealEstateWizardStore((s) => s.setProgress);

    const hasAddress = Boolean(address && address.trim().length > 0);
    const hasCoords = Boolean(coordinates);
    const canProceed = hasAddress && hasCoords;

    useEffect(() => {
        setProgress(hasAddress ? 80 : 60);
    }, [hasAddress, setProgress]);

    return (
        <div className="size-full flex flex-col justify-between gap-4 lg:gap-6">
            <div className="flex flex-col justify-between gap-4 lg:gap-6">
                <h2 className="text-lg font-bold">
                    {editMode ? 'Редактирование объекта' : 'Добавление объекта'} — Шаг 2
                </h2>

                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Адрес</h3>

                    {(!hasAddress || !hasCoords) && (
                        <p className="text-xs text-info">
                            Начните вводить адрес и <b>выберите</b> подходящий вариант из списка.
                            После выбора можно подкорректировать точку на карте перетаскиванием
                            маркера.
                        </p>
                    )}

                    {addressSearchSlot}

                    {hasAddress && !hasCoords && (
                        <div className="mt-8 alert alert-info">
                            <div>
                                <span className="font-medium">Почти готово.</span> Выберите адрес из
                                списка подсказок (и при необходимости подвиньте маркер на карте),
                                чтобы получить координаты и продолжить.
                            </div>
                        </div>
                    )}

                    <div className="sr-only" aria-live="polite">
                        {hasCoords
                            ? 'Координаты получены, можно переходить далее.'
                            : 'Координаты не выбраны.'}
                    </div>
                </div>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="join">
                    <button className="join-item btn btn-primary min-w-[30vw]" onClick={onPrev}>
                        Назад
                    </button>
                    <button className="join-item btn btn-secondary min-w-[30vw]" onClick={onCancel}>
                        Отмена
                    </button>
                    <div
                        className="join-item tooltip tooltip-left"
                        data-tip={
                            canProceed
                                ? undefined
                                : !hasAddress
                                  ? 'Нужен адрес и координаты'
                                  : 'Выберите подсказку и дождитесь координат'
                        }
                    >
                        <button
                            className="btn btn-primary min-w-[30vw]"
                            onClick={onNext}
                            disabled={!canProceed}
                        >
                            Далее
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
