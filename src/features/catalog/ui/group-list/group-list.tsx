import type { TGroup } from '@/entities/product';
import { GroupCard } from '../group-card';

type TGroupListProps = {
    groups: TGroup[];
    variant?: 'default' | 'compact';
};

export function GroupList({ groups, variant = 'default' }: TGroupListProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
                <GroupCard key={group.id} group={group} variant={variant} />
            ))}
        </div>
    );
}

export function GroupListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
            ))}
        </div>
    );
}
