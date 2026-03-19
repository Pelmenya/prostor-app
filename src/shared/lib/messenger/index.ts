export type { TPlatform, TMessengerUser, TMessengerAdapter, THapticType } from './types';
export { detectPlatform } from './utils/detect-platform';
export { setupMockTelegramEnv } from './utils/mock-telegram-env';
export { createMessengerAdapter } from './factory';
export { MessengerProvider } from './messenger-provider';
export { useMessenger, useMessengerStrict } from './hooks/use-messenger';
export { useAuth } from './hooks/use-auth';
