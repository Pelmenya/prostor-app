import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, 'Введите email').email('Неверный формат email'),
    password: z.string().min(1, 'Введите пароль'),
});

export type TLoginForm = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
    .object({
        oldPassword: z.string().min(1, 'Введите текущий пароль'),
        newPassword: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export type TChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().min(1, 'Введите email').email('Некорректный email'),
});

export type TForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

/** Общая схема: новый пароль + подтверждение. Используется в reset-password, link-account */
export const newPasswordSchema = z
    .object({
        password: z.string().min(8, 'Минимум 8 символов'),
        confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export type TNewPasswordForm = z.infer<typeof newPasswordSchema>;
