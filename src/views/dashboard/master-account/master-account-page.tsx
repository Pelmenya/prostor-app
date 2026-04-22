'use client';

import { useCurrentUser } from '@/entities/user';
import { useAccountService } from '@/entities/account-service';
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
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const { data: accountService, isLoading: isServiceLoading } = useAccountService();

    const isLoading = isUserLoading || isServiceLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    const hasLocation = !!accountService?.address;

    return (
        <div className="flex flex-col gap-4 p-4">
            {user && <PersonalInfoCard user={user} />}

            <LocationCard
                address={accountService?.address}
                departureBasis={accountService?.departureBasis}
                isLoading={isServiceLoading}
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

            {hasLocation && <ServiceAreaCard />}

            <ScheduleCard />

            <WorkCard />

            <RatingCard userId={user?.id} />
        </div>
    );
}
