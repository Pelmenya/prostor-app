'use client';

import { usePathname } from 'next/navigation';
import { ShoppingCartIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { useCartStore, selectTotalItems } from '@/entities/cart';
import { WaterDrop } from '@/shared/ui';
import { FooterItem } from './footer-item';

type TMenuItem = {
    to: string;
    icon: React.ReactNode;
    label: string;
    indicator?: number;
    paths?: string[];
};

export function Footer() {
    const pathname = usePathname();
    const items = useCartStore((s) => s.items);
    const totalItems = selectTotalItems(items);

    const isActive = (paths: string | string[]) => {
        const pathArray = Array.isArray(paths) ? paths : [paths];
        return pathArray.some((path) => pathname.includes(path));
    };

    // Web-гость: каталог + вода (карта качества) + корзина.
    // Капля «Вода» — outline-вариант через currentColor, в стиле других heroicons.
    // Active state — стандартный daisyui dock-active (primary color через CSS).
    // TODO: после авторизации — добавить заказы, профиль.
    const menu: TMenuItem[] = [
        {
            to: '/catalog',
            icon: <SquaresPlusIcon />,
            label: 'Каталог',
            paths: ['catalog', 'product'],
        },
        {
            to: '/water',
            icon: <WaterDrop variant="outline" />,
            label: 'Вода',
            paths: ['water'],
        },
        {
            to: '/cart',
            icon: <ShoppingCartIcon />,
            label: 'Корзина',
            indicator: totalItems,
        },
    ];

    return (
        <footer className="relative z-40 shrink-0 bg-base-100 border-t border-base-content/10 shadow-sm-top">
            <nav>
                <ul className="static dock dock-lg md:dock-xl lg:h-22 xl:h-24">
                    {menu.map((item) => (
                        <FooterItem
                            key={item.to}
                            to={item.to}
                            icon={item.icon}
                            label={item.label}
                            isActive={isActive(item.paths || item.to)}
                            indicator={item.indicator}
                        />
                    ))}
                </ul>
            </nav>
        </footer>
    );
}
