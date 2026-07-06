export {
    webRegister,
    webLogin,
    webLogout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    updateProfile,
    changeEmail,
    fetchCurrentUser,
    telegramNonce,
    telegramLogin,
    telegramRegister,
} from './api/auth-api';
export type { TAuthResponse, TTelegramNonceResponse, TTelegramLoginResponse } from './api/auth-api';
export { useLogout } from './lib/use-logout';
export { useTelegramOidc } from './lib/use-telegram-oidc';
export type {
    TTelegramOidcState,
    TTelegramOidcError,
    TTelegramOidcResult,
} from './lib/use-telegram-oidc';
export { REGISTRATION_NOTICE_FLAG_KEY } from './lib/registration-notice';
export {
    TELEGRAM_REG_TOKEN_KEY,
    TELEGRAM_REG_PROFILE_KEY,
    TELEGRAM_REG_ISSUED_AT_KEY,
    TELEGRAM_LINK_HINT_FLAG_KEY,
    setTelegramRegistration,
    readTelegramRegistration,
    clearTelegramRegistration,
} from './lib/telegram-registration';
export type { TTelegramProfile } from './lib/telegram-registration';
export { SessionExpiredListener } from './ui/session-expired-listener';
export { RegistrationNoticeListener } from './ui/registration-notice-listener';
export {
    loginSchema,
    newPasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    telegramRegisterSchema,
} from './lib/auth-schemas';
export type {
    TLoginForm,
    TChangePasswordForm,
    TForgotPasswordForm,
    TResetPasswordForm,
    TTelegramRegisterForm,
} from './lib/auth-schemas';
