'use client';

import { useCurrentUserSuspense } from '@/entities/user';
import { useAccountService } from '@/entities/account-service';
import { useGetMyZones } from '@/entities/service-zone';
import { useGetExecutorAverageRating } from '@/entities/order-feedback';
import { QueryBoundary } from '@/shared/ui';
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
    return (
        <QueryBoundary errorMessage="Ошибка загрузки профиля">
            <MasterAccountContent />
        </QueryBoundary>
    );
}

function MasterAccountContent() {
    const { data: user } = useCurrentUserSuspense();
    const { data: accountService } = useAccountService();
    const { data: myZones } = useGetMyZones();
    const { data: ratingData } = useGetExecutorAverageRating(user.id);

    const hasLocation = !!accountService?.address;

    return (
        <div className="flex flex-col gap-4 p-4">
            <PersonalInfoCard user={user} />

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

            {hasLocation && <ServiceAreaCard zoneCount={myZones.length} />}

            <ScheduleCard />

            <WorkCard />

            <RatingCard avgRating={ratingData?.average} linkTo={`/master/${user.id}/rating`} />
        </div>
    );
}
