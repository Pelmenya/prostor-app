import { APP_NAME } from '@/shared/config';
import { MasterWorkDayPage } from '@/views/dashboard/master-work-day';

type TProps = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: TProps) {
    const { date } = await params;
    return { title: `${date} — ${APP_NAME}` };
}

export default async function WorkDayPage({ params }: TProps) {
    const { date } = await params;
    return <MasterWorkDayPage date={date} />;
}
