import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EServiceGrade, EDepartureBasis } from '@/entities/account-service';
import { EUserRole } from '@/shared/model';

vi.mock('next/link', () => ({
    default: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/shared/ui', () => ({
    StarRating: ({ avgRating }: { avgRating?: number }) => (
        <span>{avgRating != null ? `${avgRating}` : 'Нет оценок'}</span>
    ),
}));

vi.mock('@/shared/ui/card-wrapper', () => ({
    CardWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { QualificationCard } from './qualification-card';
import { LocationCard } from './location-card';
import { VehicleCard } from './vehicle-card';
import { ServiceAreaCard } from './service-area-card';
import { ScheduleCard } from './schedule-card';
import { WorkCard } from './work-card';
import { RatingCard } from './rating-card';
import { PersonalInfoCard } from './personal-info-card';

describe('QualificationCard', () => {
    it('показывает грейд', () => {
        render(<QualificationCard grade={EServiceGrade.SPECIALIST} readOnly />);
        expect(screen.getByRole('heading', { name: 'Квалификация' })).toBeInTheDocument();
    });

    it('показывает пустое состояние без грейда', () => {
        render(<QualificationCard readOnly />);
        expect(screen.getByText('Не указана')).toBeInTheDocument();
    });

    it('в readOnly режиме нет иконки карандаша', () => {
        const { container } = render(<QualificationCard readOnly />);
        expect(container.querySelector('a')).toBeNull();
    });

    it('в режиме редактирования оборачивает в Link', () => {
        const { container } = render(<QualificationCard />);
        expect(container.querySelector('a')).toBeInTheDocument();
    });
});

describe('LocationCard', () => {
    it('показывает адрес', () => {
        render(<LocationCard address="ул. Ленина, 1" readOnly />);
        expect(screen.getByText('ул. Ленина, 1')).toBeInTheDocument();
    });

    it('показывает заглушку без адреса', () => {
        render(<LocationCard readOnly />);
        expect(screen.getByText('Укажите локацию')).toBeInTheDocument();
    });

    it('показывает базис выезда', () => {
        render(
            <LocationCard
                address="ул. Ленина, 1"
                departureBasis={EDepartureBasis.OWN_ADDRESS}
                readOnly
            />,
        );
        expect(screen.getByText(/Выезд: от адреса/)).toBeInTheDocument();
    });
});

describe('VehicleCard', () => {
    it('показывает данные автомобиля', () => {
        render(<VehicleCard carModel="Toyota Hiace" carNumber="А123БВ77" readOnly />);
        expect(screen.getByText(/Toyota Hiace/)).toBeInTheDocument();
        expect(screen.getByText(/ГОС номер: А123БВ77/)).toBeInTheDocument();
    });

    it('показывает заглушку без данных', () => {
        render(<VehicleCard readOnly />);
        expect(screen.getByText('Укажите данные автомобиля')).toBeInTheDocument();
    });

    it('показывает грузовой отсек', () => {
        render(
            <VehicleCard
                carModel="Toyota Hiace"
                maxCargoLength={200}
                maxCargoWeight={500}
                readOnly
            />,
        );
        expect(screen.getByText(/Длина, см: 200/)).toBeInTheDocument();
        expect(screen.getByText(/Макс. вес, кг: 500/)).toBeInTheDocument();
    });
});

describe('ServiceAreaCard', () => {
    it('показывает количество зон', () => {
        render(<ServiceAreaCard zoneCount={3} readOnly />);
        expect(screen.getByText('Выбрано зон: 3')).toBeInTheDocument();
    });

    it('показывает сообщение если зоны не выбраны', () => {
        render(<ServiceAreaCard readOnly />);
        expect(screen.getByText('Зоны обслуживания не выбраны')).toBeInTheDocument();
    });
});

describe('ScheduleCard', () => {
    it('рендерится с заголовком', () => {
        render(<ScheduleCard readOnly />);
        expect(screen.getByText('График работы')).toBeInTheDocument();
    });
});

describe('WorkCard', () => {
    it('рендерится с заголовком', () => {
        render(<WorkCard />);
        expect(screen.getByText('Работа')).toBeInTheDocument();
    });

    it('содержит ссылку на /master/work-days', () => {
        const { container } = render(<WorkCard />);
        expect(container.querySelector('a[href="/master/work-days"]')).toBeInTheDocument();
    });
});

describe('RatingCard', () => {
    it('показывает рейтинг', () => {
        render(<RatingCard avgRating={4.5} />);
        expect(screen.getByText('4.5')).toBeInTheDocument();
    });
});

describe('PersonalInfoCard', () => {
    const user = {
        id: 1,
        uuid: 'uuid-1',
        first_name: 'Иван',
        last_name: 'Петров',
        email: 'ivan@example.com',
        role: EUserRole.SERVICE,
        is_auth: true,
    };

    it('показывает имя и фамилию', () => {
        render(<PersonalInfoCard user={user} readOnly />);
        expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    it('показывает email', () => {
        render(<PersonalInfoCard user={user} readOnly />);
        expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    });

    it('показывает иконку редактирования в не-readOnly режиме', () => {
        const { container } = render(<PersonalInfoCard user={user} />);
        expect(container.querySelector('a')).toBeInTheDocument();
    });

    it('не показывает иконку редактирования в readOnly режиме', () => {
        const { container } = render(<PersonalInfoCard user={user} readOnly />);
        expect(container.querySelector('a')).toBeNull();
    });

    it('показывает первую букву имени если нет фото', () => {
        render(<PersonalInfoCard user={user} readOnly />);
        expect(screen.getByText('И')).toBeInTheDocument();
    });
});
