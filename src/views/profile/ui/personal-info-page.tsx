'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/lib';
import { useAuth } from '@/shared/lib/platform';
import { PageContainer, PageTitle } from '@/shared/ui';
import { ProfileForm, type TProfileFormData } from '@/entities/user';
import { updateProfile } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { extractErrorMessage } from '@/shared/lib';

export function PersonalInfoPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const { authHeader } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const initials = user
        ? (user.first_name?.charAt(0) ?? '?') + (user.last_name?.charAt(0) ?? '')
        : '?';

    const handleSave = async (data: TProfileFormData) => {
        if (!user || !authHeader) return;
        setIsLoading(true);
        setServerError(null);
        try {
            const updated = await updateProfile(authHeader, data);
            setUser(updated);
            router.push('/profile');
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    router.push('/login?from=/profile/personal-info');
                    return;
                }
                setServerError(extractErrorMessage(err.data, 'Ошибка сохранения'));
            } else {
                setServerError('Ошибка сети');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
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

                {serverError && <div className="alert alert-error text-sm">{serverError}</div>}

                <ProfileForm user={user ?? null} onSubmit={handleSave} isLoading={isLoading} />
            </div>
        </PageContainer>
    );
}
