'use client';

import { useState } from 'react';
import { useSafeBack } from '@/shared/lib';
import {
    EServiceGrade,
    useUpdateAccountService,
    getGradeLabel,
    getCategoriesByGrade,
    getCategoryLabel,
} from '@/entities/account-service';

const GRADES = [
    EServiceGrade.COURIER,
    EServiceGrade.SPECIALIST,
    EServiceGrade.SENIOR_SPECIALIST,
    EServiceGrade.MASTER,
] as const;

type TQualificationFormProps = {
    initialGrade?: EServiceGrade | null;
};

export function QualificationForm({ initialGrade }: TQualificationFormProps) {
    const safeBack = useSafeBack('/master');
    const [selected, setSelected] = useState<EServiceGrade | null>(initialGrade ?? null);
    const { mutate, isPending, error } = useUpdateAccountService();

    const categories = selected ? getCategoriesByGrade(selected) : [];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selected) return;
        mutate({ grade: selected }, { onSuccess: safeBack });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                {GRADES.map((grade) => (
                    <label
                        key={grade}
                        className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                            selected === grade
                                ? 'border-primary bg-primary/5'
                                : 'border-base-300 bg-base-100'
                        }`}
                    >
                        <input
                            type="radio"
                            className="radio radio-primary"
                            name="grade"
                            value={grade}
                            checked={selected === grade}
                            onChange={() => setSelected(grade)}
                        />
                        <span className="font-medium">{getGradeLabel(grade)}</span>
                    </label>
                ))}
            </div>

            {categories.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-base-content/60">Категории специализации:</p>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((cat) => (
                            <span key={cat} className="badge badge-primary">
                                {getCategoryLabel(cat)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <p className="text-error text-sm">Не удалось сохранить. Попробуйте ещё раз.</p>
            )}

            <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!selected || isPending}
            >
                {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Сохранить'}
            </button>
        </form>
    );
}
