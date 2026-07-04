import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrationNoticeListener } from './registration-notice-listener';

const FLAG_KEY = 'reg-notice-pending';

beforeEach(() => {
    sessionStorage.clear();
});

describe('RegistrationNoticeListener', () => {
    it('показывает баннер при выставленном флаге sessionStorage', () => {
        sessionStorage.setItem(FLAG_KEY, '1');
        render(<RegistrationNoticeListener />);

        expect(screen.getByText('Мы отправили письмо для подтверждения почты')).toBeInTheDocument();
    });

    it('скрывает баннер и удаляет флаг после клика на кнопку закрытия', () => {
        sessionStorage.setItem(FLAG_KEY, '1');
        render(<RegistrationNoticeListener />);

        fireEvent.click(screen.getByLabelText('Закрыть'));

        expect(
            screen.queryByText('Мы отправили письмо для подтверждения почты'),
        ).not.toBeInTheDocument();
        expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
    });

    it('рендерит null без флага', () => {
        const { container } = render(<RegistrationNoticeListener />);
        expect(container).toBeEmptyDOMElement();
    });
});
