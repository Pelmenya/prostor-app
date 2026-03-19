export type { TPlatform, TPlatformUser, TPlatformAdapter, THapticType } from './types';
export { detectPlatform } from './utils/detect-platform';
export { setupMockTelegramEnv } from './utils/mock-telegram-env';
export { createPlatformAdapter } from './factory';
export { PlatformProvider } from './platform-provider';
export { usePlatform, usePlatformStrict } from './hooks/use-platform';
export { useAuth } from './hooks/use-auth';
