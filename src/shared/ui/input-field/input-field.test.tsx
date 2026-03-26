import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InputField } from './input-field';

describe('InputField', () => {
    it('рендерит лейбл и children', () => {
        render(
            <InputField label="Имя">
                <input type="text" placeholder="Введите имя" />
            </InputField>,
        );
        expect(screen.getByText('Имя:')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Введите имя')).toBeInTheDocument();
    });

    it('показывает ошибку когда передана', () => {
        render(
            <InputField label="Email" error="Неверный формат почты">
                <input type="email" />
            </InputField>,
        );
        expect(screen.getByText('Неверный формат почты')).toBeInTheDocument();
    });

    it('не показывает ошибку когда не передана', () => {
        const { container } = render(
            <InputField label="Email">
                <input type="email" />
            </InputField>,
        );
        expect(container.querySelector('.text-error')).toBeNull();
    });
});
