'use client';

import { useRouter } from 'next/navigation';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { CardImage } from '@/shared/ui/card-image';
import type { TGroup } from '@/entities/product';
import { cn } from '@/shared/lib/cn';

type TGroupCardProps = {
    group: TGroup;
    variant?: 'default' | 'compact';
};

export function GroupCard({ group, variant = 'default' }: TGroupCardProps) {
    const router = useRouter();
    const imageUrl = group.systemBundle?.image?.miniatureHref ?? null;

    return (
        <CardWrapper
            variant={variant === 'compact' ? 'compact' : 'default'}
            onClick={() => router.push(`/catalog/${group.id}`)}
        >
            <CardImage
                src={imageUrl}
                alt={group.groupName ?? 'Категория'}
                aspectRatio={variant === 'compact' ? 'square' : '4/3'}
                className={cn(variant === 'compact' && 'size-16 shrink-0')}
            />
            <div className="flex flex-col gap-1">
                <h3
                    className={cn(
                        'font-medium line-clamp-3',
                        variant === 'compact' ? 'text-sm' : 'text-base lg:text-lg',
                    )}
                >
                    {group.groupName}
                </h3>
                {group.systemBundle?.description && variant !== 'compact' && (
                    <p className="text-xs text-base-content/60 line-clamp-4 lg:text-sm">
                        {group.systemBundle.description}
                    </p>
                )}
            </div>
        </CardWrapper>
    );
}
