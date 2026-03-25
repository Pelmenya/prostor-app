import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCartStore } from '@/entities/cart';
import { EServiceCategory } from '@/shared/model';
import type { TProduct, TService, TSalePrice } from '@/shared/model';
import { useCartActions } from './use-cart-actions';

// ---- Фикстуры ----

const mockSalePrice: TSalePrice = {
    value: 1500000,
    currency: {} as TSalePrice['currency'],
    priceType: { name: 'Приложение' } as TSalePrice['priceType'],
};

const mockService: TService = {
    id: 'svc-1',
    name: 'Установка фильтра',
    rateOfHours: 2,
    category: EServiceCategory.MONTAZH,
    salePrices: [{ ...mockSalePrice, value: 150000 }],
};

const PRODUCT_ID = 'prod-1';
const SERVICE_ID = 'svc-1';

const mockProduct: TProduct = {
    id: PRODUCT_ID,
    name: 'Аквафор DWM-101S',
    description: 'Фильтр обратного осмоса',
    attributes: [],
    salePrices: [mockSalePrice],
    services: [mockService],
};

// ---- Вспомогательная функция ----

function renderCartActions(product: TProduct | undefined = mockProduct) {
    return renderHook(() => useCartActions(product, PRODUCT_ID));
}

// ---- Тесты ----

describe('useCartActions', () => {
    beforeEach(() => {
        localStorage.clear();
        useCartStore.setState({ items: {}, isGuest: true });
    });

    afterEach(() => {
        cleanup();
    });

    // ------------------------------------------------------------------ //
    //  handleProductIncrement
    // ------------------------------------------------------------------ //

    describe('handleProductIncrement', () => {
        it('добавляет товар в корзину если его там нет', () => {
            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductIncrement();
            });

            const item = useCartStore.getState().items[PRODUCT_ID];
            expect(item).toBeDefined();
            expect(item.count).toBe(1);
            expect(item.price).toBe(1500000);
        });

        it('увеличивает count если товар уже есть в корзине', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductIncrement();
            });

            expect(useCartStore.getState().items[PRODUCT_ID].count).toBe(2);
        });

        it('не изменяет стор если product undefined', () => {
            const { result } = renderHook(() => useCartActions(undefined, PRODUCT_ID));
            const itemsBefore = { ...useCartStore.getState().items };

            act(() => {
                result.current.handleProductIncrement();
            });

            expect(useCartStore.getState().items).toEqual(itemsBefore);
        });
    });

    // ------------------------------------------------------------------ //
    //  handleProductDecrement
    // ------------------------------------------------------------------ //

    describe('handleProductDecrement', () => {
        it('уменьшает count товара на 1', () => {
            useCartStore.getState().addProduct(mockProduct, 3, 1500000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductDecrement();
            });

            expect(useCartStore.getState().items[PRODUCT_ID].count).toBe(2);
        });

        it('не уходит ниже 0 — удаляет запись из корзины при count=1 без услуг', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductDecrement();
            });

            // updateProductCount(id, 0) при отсутствии активных услуг удаляет запись
            expect(useCartStore.getState().items[PRODUCT_ID]).toBeUndefined();
        });

        it('не уходит ниже 0 — сохраняет запись если есть активная услуга', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductDecrement();
            });

            const item = useCartStore.getState().items[PRODUCT_ID];
            expect(item).toBeDefined();
            expect(item.count).toBe(0);
        });

        it('не делает ничего если cartItem отсутствует', () => {
            const { result } = renderCartActions();

            act(() => {
                result.current.handleProductDecrement();
            });

            expect(useCartStore.getState().items[PRODUCT_ID]).toBeUndefined();
        });
    });

    // ------------------------------------------------------------------ //
    //  handleServiceIncrement
    // ------------------------------------------------------------------ //

    describe('handleServiceIncrement', () => {
        it('создаёт cartItem через addProduct если его не было', () => {
            const { result } = renderCartActions();

            act(() => {
                result.current.handleServiceIncrement(SERVICE_ID);
            });

            // addProduct создаёт запись с count=0
            const item = useCartStore.getState().items[PRODUCT_ID];
            expect(item).toBeDefined();
            expect(item.count).toBe(0);
        });

        it('увеличивает count услуги если услуга уже есть', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleServiceIncrement(SERVICE_ID);
            });

            expect(useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID].count).toBe(2);
        });

        it('не изменяет стор если product undefined', () => {
            const { result } = renderHook(() => useCartActions(undefined, PRODUCT_ID));
            const itemsBefore = { ...useCartStore.getState().items };

            act(() => {
                result.current.handleServiceIncrement(SERVICE_ID);
            });

            expect(useCartStore.getState().items).toEqual(itemsBefore);
        });
    });

    // ------------------------------------------------------------------ //
    //  handleServiceDecrement
    // ------------------------------------------------------------------ //

    describe('handleServiceDecrement', () => {
        it('уменьшает count услуги на 1', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 3, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleServiceDecrement(SERVICE_ID);
            });

            expect(useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID].count).toBe(2);
        });

        it('не уходит ниже 0 — услуга получает count=0 и checked=false', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleServiceDecrement(SERVICE_ID);
            });

            // updateServiceCount(id, svcId, 0) обнуляет и снимает checked
            const svc = useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID];
            expect(svc.count).toBe(0);
            expect(svc.checked).toBe(false);
        });

        it('не делает ничего если cartItem отсутствует', () => {
            const { result } = renderCartActions();

            act(() => {
                result.current.handleServiceDecrement(SERVICE_ID);
            });

            expect(useCartStore.getState().items[PRODUCT_ID]).toBeUndefined();
        });
    });

    // ------------------------------------------------------------------ //
    //  handleCheckboxChange
    // ------------------------------------------------------------------ //

    describe('handleCheckboxChange', () => {
        it('создаёт cartItem и добавляет услугу если ни cartItem, ни услуги не было', () => {
            const { result } = renderCartActions();

            act(() => {
                result.current.handleCheckboxChange(SERVICE_ID, 150000);
            });

            const item = useCartStore.getState().items[PRODUCT_ID];
            expect(item).toBeDefined();
            const svc = item.services[SERVICE_ID];
            expect(svc).toBeDefined();
            expect(svc.count).toBe(1);
            expect(svc.checked).toBe(true);
        });

        it('включает услугу (checked=true, count=1) если услуга уже есть но была выключена', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 0, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleCheckboxChange(SERVICE_ID, 150000);
            });

            const svc = useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID];
            expect(svc.count).toBe(1);
            expect(svc.checked).toBe(true);
        });

        it('выключает услугу (checked=false, count=0) если услуга была включена', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleCheckboxChange(SERVICE_ID, 150000);
            });

            const svc = useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID];
            expect(svc.count).toBe(0);
            expect(svc.checked).toBe(false);
        });

        it('добавляет услугу через addService если cartItem есть но услуги нет', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            const { result } = renderCartActions();

            act(() => {
                result.current.handleCheckboxChange(SERVICE_ID, 150000);
            });

            const svc = useCartStore.getState().items[PRODUCT_ID].services[SERVICE_ID];
            expect(svc).toBeDefined();
            expect(svc.count).toBe(1);
            expect(svc.checked).toBe(true);
            expect(svc.price).toBe(150000);
        });

        it('не изменяет стор если product undefined', () => {
            const { result } = renderHook(() => useCartActions(undefined, PRODUCT_ID));
            const itemsBefore = { ...useCartStore.getState().items };

            act(() => {
                result.current.handleCheckboxChange(SERVICE_ID, 150000);
            });

            expect(useCartStore.getState().items).toEqual(itemsBefore);
        });

        it('использует цену 0 если price не передана', () => {
            const { result } = renderCartActions();

            act(() => {
                // price не передаётся — должен использоваться 0
                result.current.handleCheckboxChange(SERVICE_ID);
            });

            const svc = useCartStore.getState().items[PRODUCT_ID]?.services[SERVICE_ID];
            expect(svc).toBeDefined();
            expect(svc.price).toBe(0);
        });
    });

    // ------------------------------------------------------------------ //
    //  hasCartItems
    // ------------------------------------------------------------------ //

    describe('hasCartItems', () => {
        it('false если корзина пуста', () => {
            const { result } = renderCartActions();

            expect(result.current.hasCartItems).toBeFalsy();
        });

        it('true если count товара > 0', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);

            const { result } = renderCartActions();

            expect(result.current.hasCartItems).toBeTruthy();
        });

        it('true если услуга checked и count > 0 при count товара = 0', () => {
            useCartStore.getState().addProduct(mockProduct, 0, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);

            const { result } = renderCartActions();

            expect(result.current.hasCartItems).toBeTruthy();
        });

        it('false если товар с count=0 и все услуги unchecked', () => {
            useCartStore.getState().addProduct(mockProduct, 1, 1500000);
            useCartStore.getState().addService(PRODUCT_ID, mockService, 1, 150000);
            // обнуляем товар и услугу
            useCartStore.getState().updateProductCount(PRODUCT_ID, 0);
            // после updateProductCount(0) при наличии услуги (count=1) запись остаётся
            useCartStore.getState().updateServiceCount(PRODUCT_ID, SERVICE_ID, 0);
            // теперь оба count=0 — стор удаляет запись полностью
            // hasCartItems должен быть falsy (cartItem === undefined)

            const { result } = renderCartActions();

            expect(result.current.hasCartItems).toBeFalsy();
        });

        it('обновляется реактивно после вызова handleProductIncrement', () => {
            const { result } = renderCartActions();

            expect(result.current.hasCartItems).toBeFalsy();

            act(() => {
                result.current.handleProductIncrement();
            });

            expect(result.current.hasCartItems).toBeTruthy();
        });
    });
});
