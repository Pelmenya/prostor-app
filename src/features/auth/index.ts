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
} from './api/auth-api';
export type { TAuthResponse } from './api/auth-api';
export { useLogout } from './lib/use-logout';
export { REGISTRATION_NOTICE_FLAG_KEY } from './lib/registration-notice';
export { SessionExpiredListener } from './ui/session-expired-listener';
export { RegistrationNoticeListener } from './ui/registration-notice-listener';
export {
    loginSchema,
    newPasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from './lib/auth-schemas';
export type {
    TLoginForm,
    TChangePasswordForm,
    TForgotPasswordForm,
    TResetPasswordForm,
} from './lib/auth-schemas';
