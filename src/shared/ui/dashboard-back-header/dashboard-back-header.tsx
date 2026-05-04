'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageTitle } from '@/shared/ui/page-title';

type TDashboardBackHeaderProps = {
    title: string;
    fallbackHref?: string;
    onBack?: () => void;
};

export function DashboardBackHeader({
    title,
    fallbackHref = '/dashboard/master',
    onBack,
}: TDashboardBackHeaderProps) {
    const router = useRouter();

    function handleBack() {
        if (onBack) {
            onBack();
        } else if (window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleBack}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Назад"
            >
                <ArrowLeftIcon className="size-5" />
            </button>
            <PageTitle>{title}</PageTitle>
        </div>
    );
}
