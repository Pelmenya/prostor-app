'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/lib';
import { PageContainer, PageTitle } from '@/shared/ui';
import { ProfileForm, type TProfileFormData } from '@/entities/user';

export function PersonalInfoPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const [isLoading, setIsLoading] = useState(false);

    const initials = user
        ? (user.first_name?.charAt(0) ?? '?') + (user.last_name?.charAt(0) ?? '')
        : '?';

    const handleSave = async (data: TProfileFormData) => {
        if (!user) return;
        setIsLoading(true);
        try {
            // TODO: вызов PUT /user/me когда будет готов эндпоинт
            setUser({ ...user, ...data });
            router.push('/profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4">
                <PageTitle>Личная информация</PageTitle>

                <div className="flex flex-col items-center gap-2">
                    <div className="avatar avatar-placeholder">
                        <div className="ring-primary ring-offset-base-100 size-20 rounded-full ring-2 ring-offset-2 bg-primary text-primary-content">
                            <span className="font-semibold text-2xl">{initials}</span>
                        </div>
                    </div>
                    {user?.username && (
                        <p className="font-medium leading-[110%] opacity-70">@{user.username}</p>
                    )}
                </div>

                <ProfileForm user={user ?? null} onSubmit={handleSave} isLoading={isLoading} />
            </div>
        </PageContainer>
    );
}
