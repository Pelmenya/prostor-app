'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageTitle } from '@/shared/ui/page-title';

type TDashboardBackHeaderProps = {
    title: string;
    onBack?: () => void;
};

export function DashboardBackHeader({ title, onBack }: TDashboardBackHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={onBack ?? (() => router.back())}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Назад"
            >
                <ArrowLeftIcon className="size-5" />
            </button>
            <PageTitle>{title}</PageTitle>
        </div>
    );
}
