import type { TGroup } from '@/entities/product';
import { GroupCard } from '../group-card';
import { cn } from '@/shared/lib';

type TGroupListProps = {
    groups: TGroup[];
    variant?: 'default' | 'compact';
};

export function GroupList({ groups, variant = 'default' }: TGroupListProps) {
    if (groups.length === 0) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
                <GroupCard key={group.id} group={group} variant={variant} />
            ))}
        </div>
    );
}

export function GroupListSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-base-200 rounded-2xl">
                    <div
                        className={cn(
                            'skeleton shrink-0',
                            variant === 'compact' ? 'w-12 h-16' : 'w-20 h-26.5',
                        )}
                    />
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-4 w-full" />
                        <div className="skeleton h-4 w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    );
}
