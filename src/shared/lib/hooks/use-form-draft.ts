'use client';

import { useEffect } from 'react';
import type { FieldValues, UseFormWatch } from 'react-hook-form';

/**
 * Читает черновик формы из sessionStorage.
 * Возвращает null на сервере или при отсутствии черновика.
 */
export function getFormDraft<T>(key: string): Partial<T> | null {
    if (typeof window === 'undefined') return null;
    try {
        const saved = sessionStorage.getItem(key);
        return saved ? (JSON.parse(saved) as Partial<T>) : null;
    } catch {
        return null;
    }
}

type TUseFormDraftOptions<T extends FieldValues> = {
    /** Поля, которые НЕ нужно сохранять (например, пароль) */
    exclude?: (keyof T)[];
};

/**
 * Подписывается на изменения формы и сохраняет черновик в sessionStorage.
 * Использовать совместно с getFormDraft для восстановления defaultValues.
 *
 * @example
 * const draft = getFormDraft<TLoginForm>('login-draft');
 * const { watch } = useForm({ defaultValues: { email: draft?.email ?? '' } });
 * const { clearDraft } = useFormDraft('login-draft', watch, { exclude: ['password'] });
 */
export function useFormDraft<T extends FieldValues>(
    key: string,
    watch: UseFormWatch<T>,
    options?: TUseFormDraftOptions<T>,
): { clearDraft: () => void } {
    useEffect(() => {
        const subscription = watch((values) => {
            const toSave = { ...values };
            options?.exclude?.forEach((field) => {
                delete toSave[field as string];
            });
            sessionStorage.setItem(key, JSON.stringify(toSave));
        });
        return () => subscription.unsubscribe();
    }, [key, watch, options]);

    return {
        clearDraft: () => sessionStorage.removeItem(key),
    };
}
