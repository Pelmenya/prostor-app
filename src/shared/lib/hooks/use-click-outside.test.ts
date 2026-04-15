import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { createRef } from 'react';
import { useClickOutside } from './use-click-outside';

describe('useClickOutside', () => {
    let container: HTMLDivElement;
    let outside: HTMLDivElement;
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = document.createElement('div');
        outside = document.createElement('div');
        document.body.appendChild(container);
        document.body.appendChild(outside);
        handler = vi.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('вызывает handler при клике вне переданного рефа', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        renderHook(() => useClickOutside([ref], handler, true));

        fireEvent.pointerDown(outside);

        expect(handler).toHaveBeenCalledOnce();
    });

    it('не вызывает handler при клике внутри рефа', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        renderHook(() => useClickOutside([ref], handler, true));

        fireEvent.pointerDown(container);

        expect(handler).not.toHaveBeenCalled();
    });

    it('вызывает handler при нажатии Escape', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        renderHook(() => useClickOutside([ref], handler, true));

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(handler).toHaveBeenCalledOnce();
    });

    it('не вызывает handler при нажатии других клавиш', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        renderHook(() => useClickOutside([ref], handler, true));

        fireEvent.keyDown(document, { key: 'Enter' });
        fireEvent.keyDown(document, { key: 'Tab' });

        expect(handler).not.toHaveBeenCalled();
    });

    it('не вызывает handler когда enabled = false', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        renderHook(() => useClickOutside([ref], handler, false));

        fireEvent.pointerDown(outside);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(handler).not.toHaveBeenCalled();
    });

    it('не вызывает handler если клик внутри любого из нескольких рефов', () => {
        const ref1 = createRef<HTMLDivElement>();
        const ref2 = createRef<HTMLDivElement>();
        Object.assign(ref1, { current: container });
        Object.assign(ref2, { current: outside });

        renderHook(() => useClickOutside([ref1, ref2], handler, true));

        fireEvent.pointerDown(outside);

        expect(handler).not.toHaveBeenCalled();
    });

    it('снимает обработчики при размонтировании', () => {
        const ref = createRef<HTMLDivElement>();
        Object.assign(ref, { current: container });

        const { unmount } = renderHook(() => useClickOutside([ref], handler, true));
        unmount();

        fireEvent.pointerDown(outside);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(handler).not.toHaveBeenCalled();
    });
});
