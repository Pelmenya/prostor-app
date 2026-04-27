'use client';

import { useCurrentUser } from '@/entities/user';
import { useAccountService } from '@/entities/account-service';
import { useMyZonesCount } from '@/entities/service-zone';
import { useGetExecutorAverageRating } from '@/entities/order-feedback';
import { QueryBoundary, PageSpinner } from '@/shared/ui';
import { useAuth } from '@/shared/lib/platform';
import {
    PersonalInfoCard,
    LocationCard,
    VehicleCard,
    ServiceAreaCard,
    ScheduleCard,
    WorkCard,
    QualificationCard,
    RatingCard,
} from '@/widgets/master-profile';

export function MasterAccountPage() {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <PageSpinner />;
    return (
        <QueryBoundary errorMessage="Ошибка загрузки профиля">
            <MasterAccountContent />
        </QueryBoundary>
    );
}

function MasterAccountContent() {
    const { data: user } = useCurrentUser();
    const { data: accountService } = useAccountService();
    const { data: myZones } = useMyZonesCount();
    const { data: ratingData } = useGetExecutorAverageRating(user?.id);

    const hasLocation = !!accountService?.address;

    return (
        <div className="flex flex-col gap-4 p-4">
            {user && <PersonalInfoCard user={user} />}

            <LocationCard
                address={accountService?.address}
                departureBasis={accountService?.departureBasis}
            />

            <VehicleCard
                carModel={accountService?.carModel}
                carNumber={accountService?.carNumber}
                maxCargoLength={accountService?.maxCargoLength}
                maxCargoWidth={accountService?.maxCargoWidth}
                maxCargoHeight={accountService?.maxCargoHeight}
                maxCargoWeight={accountService?.maxCargoWeight}
            />

            <QualificationCard grade={accountService?.grade} />

            {hasLocation && <ServiceAreaCard zoneCount={myZones?.length} />}

            <ScheduleCard />

            <WorkCard />

            <RatingCard avgRating={ratingData?.average} />
        </div>
    );
}
