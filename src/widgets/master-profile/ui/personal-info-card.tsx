import Link from 'next/link';
import Image from 'next/image';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import { formatRuPhoneForView } from '@/shared/lib';
import type { TUser } from '@/shared/model';

type TPersonalInfoCardProps = {
    user: TUser;
    linkTo?: string;
    readOnly?: boolean;
};

export function PersonalInfoCard({
    user,
    linkTo = '/dashboard/master/profile',
    readOnly = false,
}: TPersonalInfoCardProps) {
    const content = (
        <CardWrapper>
            <div className="flex items-center gap-4 w-full">
                <div className="avatar">
                    <div className="ring-primary ring-offset-base-100 rounded-full ring-1 ring-offset-2 size-16">
                        {user.photo_url ? (
                            <Image
                                src={user.photo_url}
                                alt={`аватар ${user.username ?? user.first_name}`}
                                width={64}
                                height={64}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="bg-primary/10 size-16 rounded-full flex items-center justify-center text-lg font-semibold">
                                {user.first_name?.[0]}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                    <p className="font-semibold text-lg">
                        {user.first_name} {user.last_name}
                    </p>
                    {user.username && (
                        <p className="font-medium text-xs text-base-content/60">@{user.username}</p>
                    )}
                    {user.phone && (
                        <p className="font-medium text-xs">{formatRuPhoneForView(user.phone)}</p>
                    )}
                    {user.email && <p className="font-medium text-xs truncate">{user.email}</p>}
                </div>
                {!readOnly && <PencilSquareIcon className="size-6 shrink-0" />}
            </div>
        </CardWrapper>
    );

    if (readOnly) return content;

    return <Link href={linkTo}>{content}</Link>;
}
