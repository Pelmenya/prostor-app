export type { TPlatform, TMessengerUser, TMessengerAdapter } from './types';
export { detectPlatform } from './utils/detect-platform';
export { createMessengerAdapter } from './factory';
export { MessengerProvider } from './messenger-provider';
export { useMessenger, useMessengerStrict } from './hooks/use-messenger';
export { useAuth } from './hooks/use-auth';
