import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionExpiredListener } from './session-expired-listener';

const mockPush = vi.fn();
let mockPathname = '/orders';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => mockPathname,
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/orders';
});

describe('SessionExpiredListener', () => {
    it('редиректит на /login?from=<path> при auth:session-expired на приватной странице', () => {
        mockPathname = '/orders';
        render(<SessionExpiredListener />);

        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        expect(mockPush).toHaveBeenCalledWith('/login?from=%2Forders');
    });

    it('не редиректит, если уже на /login (защита от цикла)', () => {
        mockPathname = '/login';
        render(<SessionExpiredListener />);

        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        expect(mockPush).not.toHaveBeenCalled();
    });

    it('не редиректит с публичной страницы', () => {
        mockPathname = '/catalog';
        render(<SessionExpiredListener />);

        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        expect(mockPush).not.toHaveBeenCalled();
    });

    it('рендерит null', () => {
        mockPathname = '/orders';
        const { container } = render(<SessionExpiredListener />);
        expect(container).toBeEmptyDOMElement();
    });

    it('удаляет обработчик события при размонтировании', () => {
        mockPathname = '/orders';
        const { unmount } = render(<SessionExpiredListener />);
        unmount();

        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        expect(mockPush).not.toHaveBeenCalled();
    });
});
