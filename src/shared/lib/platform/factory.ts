import type { TPlatform, TPlatformAdapter } from './types';
import { TelegramAdapter } from './adapters/telegram-adapter';
import { WebAdapter } from './adapters/web-adapter';
import { MaxAdapter } from './adapters/max-adapter';

export function createPlatformAdapter(platform: TPlatform): TPlatformAdapter {
    switch (platform) {
        case 'telegram':
            return new TelegramAdapter();
        case 'max':
            return new MaxAdapter();
        case 'web':
            return new WebAdapter();
    }
}
