import type { TPlatformUser } from '@/shared/lib/platform/types';
import type { TUser } from '@/shared/model';

export function mapUserToPlatformUser(user: TUser | null): TPlatformUser | null {
    if (!user) return null;
    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        photo: user.photo_url,
    };
}
