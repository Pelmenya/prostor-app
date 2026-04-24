'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
    useCurrentUser,
    useUpdateProfile,
    ProfileForm,
    type TProfileFormData,
} from '@/entities/user';
import { PageContainer, PageTitle, PageSpinner, QueryBoundary } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';

export function MasterPersonalInfoPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки профиля">
            <MasterPersonalInfoContent />
        </QueryBoundary>
    );
}

function MasterPersonalInfoContent() {
    const router = useRouter();
    const { data: user } = useCurrentUser();
    const { mutate, isPending, error } = useUpdateProfile();

    function handleSubmit(data: TProfileFormData) {
        mutate(data, { onSuccess: () => router.back() });
    }

    return (
        <PageContainer bg="bg-base-200">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Назад"
                >
                    <ArrowLeftIcon className="size-5" />
                </button>
                <PageTitle>Личная информация</PageTitle>
            </div>
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                {error && (
                    <div className="alert alert-error text-sm">
                        Не удалось сохранить. Попробуйте ещё раз.
                    </div>
                )}
                <ProfileForm user={user ?? null} onSubmit={handleSubmit} isLoading={isPending} />
            </div>
        </PageContainer>
    );
}
