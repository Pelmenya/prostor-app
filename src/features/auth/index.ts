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
    changePasswordSchema,
    forgotPasswordSchema,
    newPasswordSchema,
} from './lib/auth-schemas';
export type {
    TLoginForm,
    TChangePasswordForm,
    TForgotPasswordForm,
    TNewPasswordForm,
} from './lib/auth-schemas';
