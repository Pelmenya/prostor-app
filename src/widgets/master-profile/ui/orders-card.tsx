import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { MasterProfileCard } from './master-profile-card';

type TOrdersCardProps = {
    linkTo?: string;
};

export function OrdersCard({ linkTo = '/master/orders' }: TOrdersCardProps) {
    return (
        <MasterProfileCard
            title="Мои заказы"
            icon={<ClipboardDocumentListIcon className="size-6" />}
            linkTo={linkTo}
            showEditIcon={false}
        />
    );
}
