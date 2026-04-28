'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import {
    useCurrentUserSuspense,
    useUpdateProfile,
    ProfileForm,
    type TProfileFormData,
} from '@/entities/user';
import { PageContainer, QueryBoundary, DashboardBackHeader } from '@/shared/ui';

export function MasterPersonalInfoPage() {
    return (
        <QueryBoundary errorMessage="Ошибка загрузки профиля">
            <MasterPersonalInfoContent />
        </QueryBoundary>
    );
}

function MasterPersonalInfoContent() {
    const router = useRouter();
    const { data: user } = useCurrentUserSuspense();
    const { mutate, isPending, error } = useUpdateProfile();

    function handleSubmit(data: TProfileFormData) {
        mutate(data, { onSuccess: () => router.back() });
    }

    return (
        <PageContainer bg="bg-base-200">
            <DashboardBackHeader title="Личная информация" />
            <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
                {error && (
                    <div className="alert alert-error text-sm">
                        Не удалось сохранить. Попробуйте ещё раз.
                    </div>
                )}
                <ProfileForm user={user} onSubmit={handleSubmit} isLoading={isPending} />
                <div className="card bg-base-100 rounded-2xl p-4 max-w-md mx-auto w-full">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-xs text-base-content/50">Email</p>
                            <p className="text-sm font-medium truncate">
                                {user?.email ?? 'Не указан'}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/master/change-email"
                            className="btn btn-ghost btn-sm btn-circle shrink-0"
                            aria-label="Изменить email"
                        >
                            <PencilSquareIcon className="size-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
