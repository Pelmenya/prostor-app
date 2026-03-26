export {
    webRegister,
    webLogin,
    webLogout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
} from './api/auth-api';
export type { TAuthResponse } from './api/auth-api';
export { useLogout } from './lib/use-logout';
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
