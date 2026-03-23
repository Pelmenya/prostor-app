import { describe, it, expect, beforeEach } from 'vitest';
import {
    useCartStore,
    selectTotalItems,
    selectTotalPrice,
    selectTotalRateOfHours,
    selectAreAllSelected,
    selectHasSelectedItems,
    selectSelectedItems,
} from './cart.store';
import type { TProduct, TService, TSalePrice } from '@/shared/model';
import { EServiceCategory } from '@/shared/model';

const mockSalePrice: TSalePrice = {
    value: 1500000,
    currency: {} as TSalePrice['currency'],
    priceType: { name: 'Приложение' } as TSalePrice['priceType'],
};

const mockProduct: TProduct = {
    id: 'prod-1',
    name: 'Аквафор DWM-101S',
    description: 'Фильтр обратного осмоса',
    attributes: [],
    salePrices: [mockSalePrice],
};

const mockService: TService = {
    id: 'svc-1',
    name: 'Установка DWM-101S',
    rateOfHours: 2,
    category: EServiceCategory.MONTAZH,
    salePrices: [
        {
            ...mockSalePrice,
            value: 150000,
        },
    ],
};

describe('cart.store', () => {
    beforeEach(() => {
        useCartStore.setState({ items: {}, isGuest: true });
    });

    describe('addProduct', () => {
        it('добавляет товар в пустую корзину', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            const items = useCartStore.getState().items;
            expect(items['prod-1']).toBeDefined();
            expect(items['prod-1'].count).toBe(1);
            expect(items['prod-1'].price).toBe(1500000);
            expect(items['prod-1'].product.name).toBe('Аквафор DWM-101S');
        });

        it('увеличивает count при повторном добавлении', () => {
            const { addProduct } = useCartStore.getState();
            addProduct(mockProduct, 1, 1500000);
            addProduct(mockProduct, 2, 1500000);

            expect(useCartStore.getState().items['prod-1'].count).toBe(3);
        });
    });

    describe('updateProductCount', () => {
        it('обновляет количество товара', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().updateProductCount('prod-1', 5);

            expect(useCartStore.getState().items['prod-1'].count).toBe(5);
        });

        it('удаляет товар если count=0 и нет услуг', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().updateProductCount('prod-1', 0);

            expect(useCartStore.getState().items['prod-1']).toBeUndefined();
        });

        it('не удаляет товар если count=0 но есть активные услуги', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().updateProductCount('prod-1', 0);

            expect(useCartStore.getState().items['prod-1']).toBeDefined();
            expect(useCartStore.getState().items['prod-1'].count).toBe(0);
        });
    });

    describe('removeProduct', () => {
        it('полностью удаляет товар', () => {
            useCartStore.getState().addProduct(mockProduct, 3, 1500000);
            useCartStore.getState().removeProduct('prod-1');

            expect(useCartStore.getState().items['prod-1']).toBeUndefined();
        });
    });

    describe('addService', () => {
        it('добавляет услугу к товару', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);

            const svc = useCartStore.getState().items['prod-1'].services['svc-1'];
            expect(svc).toBeDefined();
            expect(svc.count).toBe(1);
            expect(svc.price).toBe(150000);
            expect(svc.checked).toBe(true);
            expect(svc.service.category).toBe(EServiceCategory.MONTAZH);
        });
    });

    describe('updateServiceCount', () => {
        it('обновляет количество услуги', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().updateServiceCount('prod-1', 'svc-1', 3);

            expect(useCartStore.getState().items['prod-1'].services['svc-1'].count).toBe(3);
        });

        it('unchecked при count=0', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().updateServiceCount('prod-1', 'svc-1', 0);

            expect(useCartStore.getState().items['prod-1'].services['svc-1'].checked).toBe(false);
        });

        it('удаляет товар если count товара=0 и все услуги=0', () => {
            useCartStore.getState().addProduct(mockProduct, 0, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().updateServiceCount('prod-1', 'svc-1', 0);

            expect(useCartStore.getState().items['prod-1']).toBeUndefined();
        });
    });

    describe('clear', () => {
        it('очищает корзину', () => {
            useCartStore.getState().addProduct(mockProduct, 2, 1500000);
            useCartStore.getState().clear();

            expect(Object.keys(useCartStore.getState().items)).toHaveLength(0);
        });
    });

    describe('selectTotalItems', () => {
        it('считает товары + услуги', () => {
            useCartStore.getState().addProduct(mockProduct, 2, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 3, 150000);

            const total = selectTotalItems(useCartStore.getState().items);
            expect(total).toBe(5); // 2 товара + 3 услуги
        });

        it('не считает unchecked услуги', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().updateServiceCount('prod-1', 'svc-1', 0);

            const total = selectTotalItems(useCartStore.getState().items);
            expect(total).toBe(1); // только товар
        });
    });

    describe('selectTotalPrice', () => {
        it('считает сумму товаров + услуг', () => {
            useCartStore.getState().addProduct(mockProduct, 2, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);

            const total = selectTotalPrice(useCartStore.getState().items);
            expect(total).toBe(3150000); // 2*1500000 + 1*150000
        });
    });

    describe('selectTotalRateOfHours', () => {
        it('считает часы услуг', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 2, 150000);

            const hours = selectTotalRateOfHours(useCartStore.getState().items);
            expect(hours).toBe(4); // 2 * rateOfHours(2)
        });
    });

    describe('selectedForCheckout', () => {
        it('addProduct добавляет с selectedForCheckout: true', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            expect(useCartStore.getState().items['prod-1'].selectedForCheckout).toBe(true);
        });

        it('addService добавляет с selectedForCheckout: true', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);

            expect(
                useCartStore.getState().items['prod-1'].services['svc-1'].selectedForCheckout,
            ).toBe(true);
        });
    });

    describe('toggleProductSelected', () => {
        it('переключает selectedForCheckout товара', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().toggleProductSelected('prod-1');

            expect(useCartStore.getState().items['prod-1'].selectedForCheckout).toBe(false);

            useCartStore.getState().toggleProductSelected('prod-1');
            expect(useCartStore.getState().items['prod-1'].selectedForCheckout).toBe(true);
        });
    });

    describe('toggleServiceSelected', () => {
        it('переключает selectedForCheckout услуги', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().toggleServiceSelected('prod-1', 'svc-1');

            expect(
                useCartStore.getState().items['prod-1'].services['svc-1'].selectedForCheckout,
            ).toBe(false);
        });
    });

    describe('toggleAllSelected', () => {
        it('устанавливает selectedForCheckout для всех товаров и услуг', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().toggleAllSelected(false);

            const items = useCartStore.getState().items;
            expect(items['prod-1'].selectedForCheckout).toBe(false);
            expect(items['prod-1'].services['svc-1'].selectedForCheckout).toBe(false);

            useCartStore.getState().toggleAllSelected(true);
            const items2 = useCartStore.getState().items;
            expect(items2['prod-1'].selectedForCheckout).toBe(true);
            expect(items2['prod-1'].services['svc-1'].selectedForCheckout).toBe(true);
        });
    });

    describe('removeSelected', () => {
        it('удаляет выбранные товары', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().removeSelected();

            expect(useCartStore.getState().items['prod-1']).toBeUndefined();
        });

        it('не удаляет невыбранные товары', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().toggleProductSelected('prod-1');
            useCartStore.getState().removeSelected();

            expect(useCartStore.getState().items['prod-1']).toBeDefined();
        });

        it('удаляет выбранные услуги, оставляя невыбранные', () => {
            const mockService2: TService = {
                ...mockService,
                id: 'svc-2',
                name: 'Сервис DWM-101S',
                category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE,
            };

            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().addService('prod-1', mockService2, 1, 100000);
            // Снимаем товар и svc-2 с выбора, svc-1 остаётся selected
            useCartStore.getState().toggleProductSelected('prod-1');
            useCartStore.getState().toggleServiceSelected('prod-1', 'svc-2');
            // removeSelected удалит svc-1 (selected=true), оставит svc-2 (selected=false)
            useCartStore.getState().removeSelected();

            const item = useCartStore.getState().items['prod-1'];
            expect(item).toBeDefined();
            expect(item.services['svc-1']).toBeUndefined();
            expect(item.services['svc-2']).toBeDefined();
        });
    });

    describe('selectAreAllSelected', () => {
        it('true когда все выбраны', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);

            expect(selectAreAllSelected(useCartStore.getState().items)).toBe(true);
        });

        it('false когда товар не выбран', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().toggleProductSelected('prod-1');

            expect(selectAreAllSelected(useCartStore.getState().items)).toBe(false);
        });

        it('false для пустой корзины', () => {
            expect(selectAreAllSelected(useCartStore.getState().items)).toBe(false);
        });
    });

    describe('selectHasSelectedItems', () => {
        it('true когда хотя бы один выбран', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            expect(selectHasSelectedItems(useCartStore.getState().items)).toBe(true);
        });

        it('false когда ничего не выбрано', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().toggleProductSelected('prod-1');

            expect(selectHasSelectedItems(useCartStore.getState().items)).toBe(false);
        });
    });

    describe('selectSelectedItems', () => {
        it('возвращает только выбранные товары', () => {
            const mockProduct2: TProduct = { ...mockProduct, id: 'prod-2', name: 'Второй товар' };
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addProduct(mockProduct2, 1, 2000000);
            useCartStore.getState().toggleProductSelected('prod-2');

            const selected = selectSelectedItems(useCartStore.getState().items);
            expect(Object.keys(selected)).toEqual(['prod-1']);
        });

        it('фильтрует услуги внутри товара', () => {
            const mockService2: TService = {
                ...mockService,
                id: 'svc-2',
                name: 'Сервис',
            };
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService('prod-1', mockService, 1, 150000);
            useCartStore.getState().addService('prod-1', mockService2, 1, 100000);
            useCartStore.getState().toggleServiceSelected('prod-1', 'svc-2');

            const selected = selectSelectedItems(useCartStore.getState().items);
            expect(Object.keys(selected['prod-1'].services)).toEqual(['svc-1']);
        });
    });
});
