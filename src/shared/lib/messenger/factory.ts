import type { TPlatform, TMessengerAdapter } from './types';
import { TelegramAdapter } from './adapters/telegram-adapter';
import { WebAdapter } from './adapters/web-adapter';
import { MaxAdapter } from './adapters/max-adapter';

export function createMessengerAdapter(platform: TPlatform): TMessengerAdapter {
    switch (platform) {
        case 'telegram':
            return new TelegramAdapter();
        case 'max':
            return new MaxAdapter();
        case 'web':
            return new WebAdapter();
    }
}
