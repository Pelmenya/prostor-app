import { describe, it, expect } from 'vitest';
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth-schemas';

describe('changePasswordSchema', () => {
    it('валидные данные', () => {
        const result = changePasswordSchema.safeParse({
            oldPassword: 'old12345',
            newPassword: 'new12345',
            confirmPassword: 'new12345',
        });
        expect(result.success).toBe(true);
    });

    it('пустой старый пароль', () => {
        const result = changePasswordSchema.safeParse({
            oldPassword: '',
            newPassword: 'new12345',
            confirmPassword: 'new12345',
        });
        expect(result.success).toBe(false);
    });

    it('новый пароль < 8 символов', () => {
        const result = changePasswordSchema.safeParse({
            oldPassword: 'old12345',
            newPassword: 'short',
            confirmPassword: 'short',
        });
        expect(result.success).toBe(false);
    });

    it('пароли не совпадают', () => {
        const result = changePasswordSchema.safeParse({
            oldPassword: 'old12345',
            newPassword: 'new12345',
            confirmPassword: 'different',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('confirmPassword');
        }
    });
});

describe('forgotPasswordSchema', () => {
    it('валидный email', () => {
        const result = forgotPasswordSchema.safeParse({ email: 'test@mail.ru' });
        expect(result.success).toBe(true);
    });

    it('невалидный email', () => {
        const result = forgotPasswordSchema.safeParse({ email: 'not-email' });
        expect(result.success).toBe(false);
    });

    it('пустой email', () => {
        const result = forgotPasswordSchema.safeParse({ email: '' });
        expect(result.success).toBe(false);
    });
});

describe('resetPasswordSchema', () => {
    it('валидные данные', () => {
        const result = resetPasswordSchema.safeParse({
            password: 'new12345',
            confirmPassword: 'new12345',
        });
        expect(result.success).toBe(true);
    });

    it('пароль < 8 символов', () => {
        const result = resetPasswordSchema.safeParse({
            password: 'short',
            confirmPassword: 'short',
        });
        expect(result.success).toBe(false);
    });

    it('пароли не совпадают', () => {
        const result = resetPasswordSchema.safeParse({
            password: 'new12345',
            confirmPassword: 'different',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('confirmPassword');
        }
    });

    it('пустое подтверждение', () => {
        const result = resetPasswordSchema.safeParse({
            password: 'new12345',
            confirmPassword: '',
        });
        expect(result.success).toBe(false);
    });
});
