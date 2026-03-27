'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
    HomeModernIcon,
    BuildingOffice2Icon,
    BuildingLibraryIcon,
    MinusIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import {
    useCreateRealEstate,
    useUpdateRealEstate,
    TYPE_NAMES,
    SOURCE_NAMES,
    POINT_NAMES,
} from '@/entities/real-estate';
import { InputField, PageContainer, PageTitle } from '@/shared/ui';
import {
    realEstateSchema,
    DEFAULT_FORM_VALUES,
    type TRealEstateForm,
} from '../../lib/real-estate-schema';
import type {
    TRealEstate,
    TRealEstateType,
    TRealEstateSourceWater,
    TWaterIntakePoints,
} from '@/shared/model';

const TYPE_ICONS: Record<TRealEstateType, typeof HomeModernIcon> = {
    apartment: BuildingOffice2Icon,
    house: HomeModernIcon,
    prom: BuildingLibraryIcon,
};

const TYPE_ENTRIES = (Object.keys(TYPE_NAMES) as TRealEstateType[]).map((value) => ({
    value,
    label: TYPE_NAMES[value],
    Icon: TYPE_ICONS[value],
}));

const SOURCE_ENTRIES = (Object.keys(SOURCE_NAMES) as TRealEstateSourceWater[]).map((value) => ({
    value,
    label: SOURCE_NAMES[value],
}));

const WATER_POINT_ENTRIES = (Object.keys(POINT_NAMES) as (keyof TWaterIntakePoints)[]).map(
    (key) => ({
        key,
        label: POINT_NAMES[key],
    }),
);

const STEP_FIELDS: (keyof TRealEstateForm)[][] = [
    ['address', 'activeType', 'residents'],
    ['activeSource'],
    ['waterIntakePoints'],
];

const LAST_STEP = STEP_FIELDS.length - 1;

const MAX_RESIDENTS = 50;

type TRealEstateWizardProps = {
    editData?: TRealEstate;
};

export function RealEstateWizard({ editData }: TRealEstateWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);
    const createMutation = useCreateRealEstate();
    const updateMutation = useUpdateRealEstate();

    const isEdit = !!editData;

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<TRealEstateForm>({
        resolver: zodResolver(realEstateSchema),
        defaultValues: editData
            ? {
                  address: editData.address,
                  activeType: editData.activeType,
                  residents: editData.residents,
                  activeSource: editData.activeSource,
                  depthWaterSource: editData.depthWaterSource,
                  waterIntakePoints: editData.waterIntakePoints,
              }
            : DEFAULT_FORM_VALUES,
    });

    const activeType = watch('activeType');
    const activeSource = watch('activeSource');
    const residents = watch('residents');

    const nextStep = async () => {
        const valid = await trigger(STEP_FIELDS[step]);
        if (valid) setStep((s) => Math.min(s + 1, LAST_STEP));
    };

    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const onSubmit = async (form: TRealEstateForm) => {
        setServerError(null);
        const payload = {
            ...form,
            depthWaterSource:
                form.activeSource === 'borehole' || form.activeSource === 'well'
                    ? form.depthWaterSource
                    : undefined,
        };

        try {
            if (isEdit && editData) {
                await updateMutation.mutateAsync({ id: editData.id, data: payload });
                toast.success('Объект обновлён');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Объект добавлен');
            }
            router.push('/profile/addresses');
        } catch {
            setServerError('Не удалось сохранить объект');
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <PageTitle>{isEdit ? 'Редактировать объект' : 'Новый объект'}</PageTitle>

                <ul className="steps steps-horizontal w-full text-xs">
                    <li className={`step ${step >= 0 ? 'step-primary' : ''}`}>Адрес</li>
                    <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Вода</li>
                    <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Точки</li>
                </ul>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* ─── Шаг 1: Адрес + тип ─────────────────────────── */}
                    {step === 0 && (
                        <>
                            <InputField label="Адрес" error={errors.address?.message}>
                                <input
                                    type="text"
                                    placeholder="Город, улица, дом, квартира"
                                    className={`input input-sm w-full ${errors.address ? 'input-error' : ''}`}
                                    {...register('address')}
                                />
                            </InputField>

                            <div>
                                <span className="label-text text-sm font-medium">Тип объекта</span>
                                {errors.activeType && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.activeType.message}
                                    </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                    {TYPE_ENTRIES.map(({ value, label, Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`btn btn-sm flex-1 ${activeType === value ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setValue('activeType', value)}
                                        >
                                            <Icon className="size-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="label-text text-sm font-medium">
                                    Жителей: {residents}
                                </span>
                                <input
                                    type="range"
                                    min={1}
                                    max={MAX_RESIDENTS}
                                    className="range range-primary range-xs mt-2"
                                    {...register('residents', { valueAsNumber: true })}
                                />
                                {errors.residents && (
                                    <p className="text-error text-xs mt-1">
                                        {errors.residents.message}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ─── Шаг 2: Источник воды ───────────────────────── */}
                    {step === 1 && (
                        <>
                            <div>
                                <span className="label-text text-sm font-medium">
                                    Источник воды
                                </span>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {SOURCE_ENTRIES.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`btn btn-sm ${activeSource === value ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setValue('activeSource', value)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(activeSource === 'borehole' || activeSource === 'well') && (
                                <InputField label="Глубина источника (м)">
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="Например, 25"
                                        className="input input-sm w-full"
                                        {...register('depthWaterSource', { valueAsNumber: true })}
                                    />
                                </InputField>
                            )}
                        </>
                    )}

                    {/* ─── Шаг 3: Точки водозабора ────────────────────── */}
                    {step === 2 && (
                        <div className="flex flex-col gap-3">
                            <span className="label-text text-sm font-medium">Точки водозабора</span>
                            {WATER_POINT_ENTRIES.map(({ key, label }) => (
                                <Controller
                                    key={key}
                                    name={`waterIntakePoints.${key}`}
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between bg-base-100 rounded-xl p-3 border border-base-300">
                                            <span className="text-sm">{label}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-circle btn-outline"
                                                    aria-label={`Уменьшить ${label}`}
                                                    onClick={() =>
                                                        field.onChange(Math.max(0, field.value - 1))
                                                    }
                                                >
                                                    <MinusIcon className="size-3" />
                                                </button>
                                                <span className="w-6 text-center font-semibold">
                                                    {field.value}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-circle btn-outline"
                                                    aria-label={`Увеличить ${label}`}
                                                    onClick={() => field.onChange(field.value + 1)}
                                                >
                                                    <PlusIcon className="size-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                />
                            ))}
                        </div>
                    )}

                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}

                    {/* ─── Навигация ──────────────────────────────────── */}
                    <div className="flex gap-2 mt-2">
                        {step > 0 && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline flex-1"
                                onClick={prevStep}
                            >
                                Назад
                            </button>
                        )}
                        {step < LAST_STEP ? (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary flex-1"
                                onClick={nextStep}
                            >
                                Далее
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-sm btn-primary flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <span className="loading loading-spinner loading-xs" />
                                )}
                                {isEdit ? 'Сохранить' : 'Добавить объект'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </PageContainer>
    );
}
