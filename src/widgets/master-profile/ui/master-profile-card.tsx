import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import type { ReactNode } from 'react';

type TMasterProfileCardProps = {
    title: string;
    icon?: ReactNode;
    children?: ReactNode;
    linkTo?: string;
    readOnly?: boolean;
    showEditIcon?: boolean;
    outlined?: boolean;
};

export function MasterProfileCard({
    title,
    icon,
    children,
    linkTo,
    readOnly = false,
    showEditIcon,
    outlined = false,
}: TMasterProfileCardProps) {
    const shouldShowEdit = showEditIcon ?? !readOnly;

    const content = (
        <CardWrapper outlined={outlined}>
            <div className="flex items-center gap-4 w-full">
                {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h5 className="font-semibold">{title}</h5>
                    </div>
                    {children && (
                        <>
                            <div className="divider m-0" />
                            {children}
                        </>
                    )}
                </div>
                {shouldShowEdit && <PencilSquareIcon className="size-6 shrink-0" />}
            </div>
        </CardWrapper>
    );

    if (readOnly || !linkTo) return content;

    return <Link href={linkTo}>{content}</Link>;
}
