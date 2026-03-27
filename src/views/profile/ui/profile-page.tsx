'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { PencilSquareIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuthStore, normalizeRuPhone, formatRuPhoneForView } from '@/shared/lib';
import { PageContainer, PageTitle } from '@/shared/ui';

export function ProfilePage() {
    const user = useAuthStore((s) => s.user);
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    if (!mounted || !user) return null;

    const initials = (user.first_name?.charAt(0) ?? '?') + (user.last_name?.charAt(0) ?? '');
    const phone = user.phone ? formatRuPhoneForView(normalizeRuPhone(user.phone)) : null;

    return (
        <PageContainer>
            <div className="flex flex-col gap-4 lg:gap-6">
                <PageTitle>Личный кабинет</PageTitle>

                <Link href="/profile/personal-info" className="block active:opacity-70">
                    <div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
                        <div className="avatar avatar-placeholder shrink-0">
                            <div className="ring-primary ring-offset-base-100 size-16 rounded-full ring-1 ring-offset-2 bg-primary text-primary-content">
                                <span className="font-semibold text-lg">{initials}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="font-semibold text-lg">
                                {user.first_name} {user.last_name}
                            </p>
                            {user.username && (
                                <p className="text-xs text-base-content/60">@{user.username}</p>
                            )}
                            {phone && <p className="text-xs">{phone}</p>}
                        </div>
                        <PencilSquareIcon className="size-5 shrink-0" />
                    </div>
                </Link>

                <Link href="/profile/change-email" className="block active:opacity-70">
                    <div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
                        <EnvelopeIcon className="size-5 shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <h3 className="font-semibold">Изменить почту</h3>
                            {user.email && (
                                <p className="text-xs text-base-content/60 truncate">
                                    {user.email}
                                </p>
                            )}
                        </div>
                        <PencilSquareIcon className="size-5 shrink-0" />
                    </div>
                </Link>

                <Link href="/profile/change-password" className="block active:opacity-70">
                    <div className="p-4 bg-base-100 rounded-2xl border border-base-content/10 flex items-center gap-4 w-full">
                        <LockClosedIcon className="size-5 shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <h3 className="font-semibold">Сменить пароль</h3>
                        </div>
                        <PencilSquareIcon className="size-5 shrink-0" />
                    </div>
                </Link>
            </div>
        </PageContainer>
    );
}
