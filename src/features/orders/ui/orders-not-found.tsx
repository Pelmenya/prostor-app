import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/shared/lib';

export type TOrdersNotFoundType = 'tab' | 'empty';

type TOrdersNotFoundProps = {
    title?: string;
    actionLabel?: string;
    href?: string;
    widthClass?: string;
    type?: TOrdersNotFoundType;
};

const DEFAULT_CONFIGS: Record<
    TOrdersNotFoundType,
    {
        title: string;
        actionLabel?: string;
    }
> = {
    tab: {
        title: 'У вас нет заказов',
        actionLabel: 'Перейти в каталог',
    },
    empty: {
        title: 'Заказы не найдены',
    },
};

export function OrdersNotFound({
    title: customTitle,
    actionLabel: customActionLabel,
    href,
    widthClass,
    type = 'empty',
}: TOrdersNotFoundProps) {
    const config = DEFAULT_CONFIGS[type];
    const title = customTitle ?? config.title;
    const actionLabel = customActionLabel ?? config.actionLabel;

    return (
        <div className="alert alert-outline alert-vertical border-base-content rounded-2xl">
            <InformationCircleIcon className="size-6 text-info" />

            <p className={cn('leading-none text-center font-medium text-sm', widthClass)}>
                {title}
            </p>

            {href && actionLabel && (
                <Link href={href} className="btn btn-link btn-sm">
                    <span className="text-primary">{actionLabel}</span>
                </Link>
            )}
        </div>
    );
}
