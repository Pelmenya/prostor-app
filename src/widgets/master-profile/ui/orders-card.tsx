import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { MASTER_ORDERS_PATH } from '@/shared/config';
import { MasterProfileCard } from './master-profile-card';

type TOrdersCardProps = {
    linkTo?: string;
};

export function OrdersCard({ linkTo = MASTER_ORDERS_PATH }: TOrdersCardProps) {
    return (
        <MasterProfileCard
            title="Мои заказы"
            icon={<ClipboardDocumentListIcon className="size-6" />}
            linkTo={linkTo}
            showEditIcon={false}
        />
    );
}
