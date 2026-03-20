'use client';

import { useRouter } from 'next/navigation';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { CardImage } from '@/shared/ui/card-image';
import type { TGroup } from '@/entities/product';
import { useBundleImages, getImageProxyUrl } from '@/entities/product';
import { cn } from '@/shared/lib';

type TGroupCardProps = {
    group: TGroup;
    variant?: 'default' | 'compact';
};

export function GroupCard({ group, variant = 'default' }: TGroupCardProps) {
    const router = useRouter();

    const { data: images, isLoading: isImagesLoading } = useBundleImages(group.systemBundle?.id);
    const mainImage = images?.[0];
    const imageUrl = mainImage ? getImageProxyUrl(mainImage.meta.downloadHref) : null;

    return (
        <CardWrapper variant={variant} onClick={() => router.push(`/catalog/${group.id}`)}>
            <CardImage
                src={imageUrl}
                isLoading={isImagesLoading}
                alt={group.groupName ?? 'Категория'}
                className={cn(variant === 'compact' ? 'w-12 min-h-16' : 'w-20 min-h-26.5')}
            />
            <div className="w-full flex flex-col gap-2">
                <h5
                    className={cn(
                        'font-semibold tracking-tight leading-[110%]',
                        variant === 'compact'
                            ? 'text-sm line-clamp-1'
                            : 'text-base line-clamp-3 lg:text-lg',
                    )}
                >
                    {group.groupName}
                </h5>
                {group.systemBundle?.description && (
                    <p
                        className={cn(
                            'tracking-tight leading-[150%]',
                            variant === 'compact'
                                ? 'text-ex-min line-clamp-2'
                                : 'text-xs line-clamp-4 lg:text-sm',
                        )}
                    >
                        {group.systemBundle.description}
                    </p>
                )}
            </div>
        </CardWrapper>
    );
}
