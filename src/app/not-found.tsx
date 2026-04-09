'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="flex flex-col w-full h-dvh bg-base-100">
            {/* Минимальная шапка: только логотип */}
            <header className="shrink-0 bg-base-100 border-b border-base-content/10 shadow-sm">
                <div className="navbar px-4 py-2">
                    <Link href="/catalog" className="text-lg font-bold gradient-text ml-1">
                        PROSTOR
                    </Link>
                </div>
            </header>

            {/* Контент */}
            <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
                <p className="text-8xl font-bold gradient-text leading-none">404</p>
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold">Страница не найдена</h1>
                    <p className="text-base-content/60 text-sm">
                        Возможно, она была удалена или вы перешли по неверной ссылке.
                    </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => router.back()}>
                    <ArrowLeftIcon className="size-4" />
                    Вернуться
                </button>
            </main>
        </div>
    );
}
