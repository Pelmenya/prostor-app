import { z } from 'zod';

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
