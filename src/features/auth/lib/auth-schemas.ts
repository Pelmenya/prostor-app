import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    password: z.string().min(1, 'Введите пароль'),
});

export type TLoginForm = z.infer<typeof loginSchema>;

export const newPasswordSchema = z
    .object({
        oldPassword: z.string().min(1, 'Введите текущий пароль'),
        newPassword: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export type TChangePasswordForm = z.infer<typeof newPasswordSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Введите email').email('Некорректный email'),
});

export type TForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export type TResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// Дублирует register-page.tsx:25 `phoneE164Ru` — тот же формат номера.
// Хоистинг в общую константу не входит в скоуп этого плана (register-page.tsx
// не в files_modified) — не давать двум регулярным выражениям разойтись.
const telegramPhoneE164Ru = /^\+7\d{10}$/;

export const telegramRegisterSchema = z.object({
    first_name: z.string().trim().min(1, 'Имя обязательно'),
    last_name: z.string().trim().min(1, 'Фамилия обязательна'),
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    phone: z.string().regex(telegramPhoneE164Ru, 'Введите номер в формате +7 999 999-99-99'),
    agreePolicy: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие с политикой конфиденциальности',
    }),
    agreePd: z.boolean().refine((v) => v === true, {
        message: 'Необходимо согласие на обработку персональных данных',
    }),
});

export type TTelegramRegisterForm = z.infer<typeof telegramRegisterSchema>;
