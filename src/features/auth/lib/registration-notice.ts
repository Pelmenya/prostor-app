/**
 * Ключ sessionStorage-флага REG-03: выставляется register-page.tsx после
 * успешной регистрации, читается RegistrationNoticeListener на следующей
 * странице. Единый источник правды — избегаем рассинхрона строкового
 * литерала между писателем и читателем (WR-03).
 */
export const REGISTRATION_NOTICE_FLAG_KEY = 'reg-notice-pending';
