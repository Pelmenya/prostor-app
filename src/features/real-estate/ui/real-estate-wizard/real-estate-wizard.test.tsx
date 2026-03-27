import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { RealEstateWizard } from './real-estate-wizard';

const mockPush = vi.fn();
const mockCreateMutateAsync = vi.fn().mockResolvedValue({});
const mockUpdateMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/entities/real-estate', () => ({
    useCreateRealEstate: () => ({ mutateAsync: mockCreateMutateAsync }),
    useUpdateRealEstate: () => ({ mutateAsync: mockUpdateMutateAsync }),
}));

vi.mock('@/shared/api', () => ({
    useApi: () => vi.fn(),
}));

function renderWithProviders(ui: ReactNode) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(createElement(QueryClientProvider, { client: queryClient }, ui));
}

describe('RealEstateWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерит шаг 1 с полем адреса', () => {
        renderWithProviders(createElement(RealEstateWizard));
        expect(screen.getByPlaceholderText('Город, улица, дом, квартира')).toBeInTheDocument();
        expect(screen.getByText('Квартира')).toBeInTheDocument();
        expect(screen.getByText('Дом')).toBeInTheDocument();
        expect(screen.getByText('Промобъект')).toBeInTheDocument();
    });

    it('не переходит на шаг 2 без адреса', async () => {
        const user = userEvent.setup();
        renderWithProviders(createElement(RealEstateWizard));

        await user.click(screen.getByText('Далее'));

        await waitFor(() => {
            expect(screen.getByText('Введите адрес')).toBeInTheDocument();
        });
    });

    it('переходит на шаг 2 при заполненном адресе', async () => {
        const user = userEvent.setup();
        renderWithProviders(createElement(RealEstateWizard));

        await user.type(
            screen.getByPlaceholderText('Город, улица, дом, квартира'),
            'Москва, ул. Ленина, 1',
        );
        await user.click(screen.getByText('Далее'));

        await waitFor(() => {
            expect(screen.getByText('Источник воды')).toBeInTheDocument();
        });
    });

    it('переходит на шаг 3 и показывает точки водозабора', async () => {
        const user = userEvent.setup();
        renderWithProviders(createElement(RealEstateWizard));

        await user.type(screen.getByPlaceholderText('Город, улица, дом, квартира'), 'Москва');
        await user.click(screen.getByText('Далее'));

        await waitFor(() => {
            expect(screen.getByText('Источник воды')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Далее'));

        await waitFor(() => {
            expect(screen.getByText('Унитаз')).toBeInTheDocument();
            expect(screen.getByText('Раковина')).toBeInTheDocument();
            expect(screen.getByText('Ванна')).toBeInTheDocument();
        });
    });

    it('кнопка Назад возвращает на предыдущий шаг', async () => {
        const user = userEvent.setup();
        renderWithProviders(createElement(RealEstateWizard));

        await user.type(screen.getByPlaceholderText('Город, улица, дом, квартира'), 'Москва');
        await user.click(screen.getByText('Далее'));

        await waitFor(() => {
            expect(screen.getByText('Источник воды')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Назад'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Город, улица, дом, квартира')).toBeInTheDocument();
        });
    });

    it('заголовок «Редактировать объект» в режиме редактирования', () => {
        const editData = {
            id: 1,
            address: 'Тестовый адрес',
            geoData: null,
            suggestion: null,
            coordinates: null,
            activeType: 'house' as const,
            residents: 4,
            activeSource: 'borehole' as const,
            depthWaterSource: 25,
            waterIntakePoints: {
                toilet: 1,
                sink: 2,
                bath: 1,
                washingMachine: 1,
                dishWasher: 0,
                showerCabin: 1,
            },
            created_at: '',
            updated_at: '',
        };

        renderWithProviders(createElement(RealEstateWizard, { editData }));
        expect(screen.getByText('Редактировать объект')).toBeInTheDocument();
    });
});
