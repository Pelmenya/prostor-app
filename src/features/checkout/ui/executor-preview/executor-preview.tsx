import Image from 'next/image';
import { formatDateRu } from '@/shared/lib';
import type { TUserWithWorkDays } from '../../model/types/t-user-with-work-days';

type TExecutorPreviewProps = {
    executor: TUserWithWorkDays;
};

export function ExecutorPreview({ executor }: TExecutorPreviewProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                {executor.user.photo_url && (
                    <Image
                        src={executor.user.photo_url}
                        alt={executor.user.last_name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                    />
                )}
                <div>
                    <p className="font-medium text-sm">
                        {executor.user.first_name} {executor.user.last_name}
                    </p>
                </div>
            </div>
            {executor.workDays?.[0]?.date && (
                <p className="badge badge-warning">
                    Дата: {formatDateRu(executor.workDays[0].date)}
                </p>
            )}
        </div>
    );
}
