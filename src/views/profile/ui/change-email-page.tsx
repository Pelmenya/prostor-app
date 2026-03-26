'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/lib/platform';
import { extractErrorMessage } from '@/shared/lib';
import { PageContainer, PageTitle, FormCard, InputField } from '@/shared/ui';
import { changeEmail } from '@/features/auth';
import { ApiError } from '@/shared/api';

const schema = z.object({
    email: z.string().email('Неверный формат почты'),
});

type TChangeEmailForm = z.infer<typeof schema>;

export function ChangeEmailPage() {
    const { authHeader } = useAuth();
    const router = useRouter();
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TChangeEmailForm>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (form: TChangeEmailForm) => {
        if (!authHeader) return;
        setServerError(null);
        try {
            await changeEmail(authHeader, form.email);
            setSentTo(form.email);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    router.push('/login?from=/profile/change-email');
                    return;
                }
                setServerError(extractErrorMessage(err.data, 'Ошибка смены email'));
            } else {
                setServerError('Ошибка сети');
            }
        }
    };

    if (sentTo) {
        return (
            <PageContainer>
                <div className="flex flex-col gap-4">
                    <PageTitle>Изменить почту</PageTitle>
                    <div className="alert alert-success text-sm">
                        Письмо отправлено на <strong>{sentTo}</strong>. Перейдите по ссылке в письме
                        для подтверждения.
                    </div>
                    <p className="text-sm text-base-content/60">
                        Не пришло? Проверьте папку «Спам».
                    </p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <PageTitle>Смена почты</PageTitle>

                <FormCard
                    onSubmit={handleSubmit(onSubmit)}
                    submitText="Отправить ссылку"
                    isLoading={isSubmitting}
                >
                    <InputField label="Новый email" error={errors.email?.message}>
                        <input
                            type="email"
                            placeholder="new@mail.ru"
                            autoComplete="email"
                            className={`input input-sm w-full ${errors.email ? 'input-error' : ''}`}
                            {...register('email')}
                        />
                    </InputField>

                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}
                </FormCard>
            </div>
        </PageContainer>
    );
}
