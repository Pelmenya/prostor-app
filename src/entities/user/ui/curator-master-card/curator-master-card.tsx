import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { curatorMasterPath } from '@/shared/config';
import { formatUserInitials, formatRuPhoneForView } from '@/shared/lib';
import type { TCuratorServiceUser } from '@/shared/model';

const GRADE_LABELS: Record<string, string> = {
    courier: 'Курьер',
    specialist: 'Специалист',
    senior_specialist: 'Старший специалист',
    master: 'Мастер',
};

type TCuratorMasterCardProps = {
    user: TCuratorServiceUser;
};

export function CuratorMasterCard({ user }: TCuratorMasterCardProps) {
    const initials = formatUserInitials(user.first_name, user.last_name);
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';
    const phone = user.phone ? formatRuPhoneForView(user.phone) : null;
    const as = user.accountService;
    const gradeLabel = as?.grade ? (GRADE_LABELS[as.grade] ?? as.grade) : null;
    const address = as?.address ?? null;

    return (
        <Link
            href={curatorMasterPath(user.id)}
            className="flex items-center gap-3 bg-base-100 rounded-xl px-4 py-3 hover:bg-base-200 transition-colors active:scale-[0.99]"
        >
            <div className={`avatar shrink-0 ${!user.photo_url ? 'avatar-placeholder' : ''}`}>
                <div
                    className={`relative size-10 rounded-full overflow-hidden ${!user.photo_url ? (as?.isEnabled ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/40') : ''}`}
                >
                    {user.photo_url ? (
                        <Image src={user.photo_url} alt={fullName} fill className="object-cover" />
                    ) : (
                        <span className="text-sm font-semibold">{initials}</span>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{fullName}</p>
                    {gradeLabel && (
                        <span className="badge badge-xs badge-ghost shrink-0">{gradeLabel}</span>
                    )}
                </div>

                <div className="flex items-center gap-3 mt-0.5">
                    {user.avgRating != null && user.avgRating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-warning">
                            <StarIcon className="size-3" />
                            {user.avgRating.toFixed(1)}
                        </span>
                    )}
                    {phone && <p className="text-xs text-base-content/60 truncate">{phone}</p>}
                </div>

                {address && (
                    <p className="text-xs text-base-content/40 truncate mt-0.5">{address}</p>
                )}

                <div className="flex items-center gap-1.5 mt-1">
                    {as && (
                        <span
                            className={`badge badge-xs ${as.isEnabled ? 'badge-success' : 'badge-error badge-outline'}`}
                        >
                            {as.isEnabled ? 'Активен' : 'Неактивен'}
                        </span>
                    )}
                    {as?.canEdit && (
                        <span className="badge badge-xs badge-info badge-outline">
                            Самостоятельно
                        </span>
                    )}
                </div>
            </div>

            <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
        </Link>
    );
}
