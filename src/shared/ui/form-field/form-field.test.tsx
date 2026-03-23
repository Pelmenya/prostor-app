import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './form-field';

describe('FormField', () => {
    it('рендерит label и children', () => {
        render(
            <FormField label="Email">
                <input type="email" placeholder="test@mail.ru" />
            </FormField>,
        );
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('test@mail.ru')).toBeInTheDocument();
    });

    it('показывает ошибку когда передана', () => {
        render(
            <FormField label="Email" error="Неверный формат">
                <input type="email" />
            </FormField>,
        );
        expect(screen.getByText('Неверный формат')).toBeInTheDocument();
    });

    it('не показывает ошибку когда не передана', () => {
        const { container } = render(
            <FormField label="Email">
                <input type="email" />
            </FormField>,
        );
        expect(container.querySelector('.text-error')).toBeNull();
    });
});
