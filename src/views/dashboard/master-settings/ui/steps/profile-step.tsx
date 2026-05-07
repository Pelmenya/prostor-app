'use client';

import { forwardRef } from 'react';
import { useCurrentUserSuspense, useUpdateProfile, ProfileForm } from '@/entities/user';
import type { TProfileFormHandle, TProfileFormData } from '@/entities/user';

export const ProfileStep = forwardRef<TProfileFormHandle>(function ProfileStep(_, ref) {
    const { data: user } = useCurrentUserSuspense();
    const { mutateAsync } = useUpdateProfile();

    async function handleSubmit(data: TProfileFormData) {
        await mutateAsync(data);
    }

    return (
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
            <h2 className="text-xl font-bold">Профиль</h2>
            <p className="text-sm text-base-content/60">Укажите ваше имя и контактный телефон.</p>
            <ProfileForm ref={ref} user={user} onSubmit={handleSubmit} hideSubmit />
        </div>
    );
});
