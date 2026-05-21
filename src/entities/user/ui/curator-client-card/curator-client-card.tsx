import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { curatorClientPath } from '@/shared/config';
import { formatUserInitials, formatDateRu, formatRuPhoneForView } from '@/shared/lib';
import type { TCuratorUser } from '@/shared/model';

type TCuratorClientCardProps = {
    user: TCuratorUser;
};

export function CuratorClientCard({ user }: TCuratorClientCardProps) {
    const initials = formatUserInitials(user.first_name, user.last_name);
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';
    const phone = user.phone ? formatRuPhoneForView(user.phone) : null;
    const date = formatDateRu(user.created_at);

    return (
        <Link
            href={curatorClientPath(user.id)}
            className="flex items-center gap-3 bg-base-100 rounded-xl px-4 py-3 hover:bg-base-200 transition-colors active:scale-[0.99]"
        >
            <div className={`avatar shrink-0 ${!user.photo_url ? 'avatar-placeholder' : ''}`}>
                <div className="relative size-10 rounded-full overflow-hidden bg-primary/10 text-primary">
                    {user.photo_url ? (
                        <Image src={user.photo_url} alt={fullName} fill className="object-cover" />
                    ) : (
                        <span className="text-sm font-semibold">{initials}</span>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fullName}</p>

                <div className="flex flex-col gap-0.5 mt-0.5">
                    {phone && <p className="text-xs text-base-content/60 truncate">{phone}</p>}
                    {user.email && (
                        <p className="text-xs text-base-content/60 truncate">{user.email}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <span
                        className={`badge badge-xs ${user.is_auth ? 'badge-success' : 'badge-ghost'}`}
                    >
                        {user.is_auth ? 'Авторизован' : 'Не авторизован'}
                    </span>
                    <span className="text-xs text-base-content/40">{date}</span>
                </div>
            </div>

            <ChevronRightIcon className="size-4 text-base-content/30 shrink-0" />
        </Link>
    );
}
