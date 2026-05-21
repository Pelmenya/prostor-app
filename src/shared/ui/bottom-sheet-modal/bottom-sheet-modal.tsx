'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib';

type TBottomSheetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    /**
     * Опциональный footer (CTA-кнопка / sticky action) вне scroll area.
     * Гарантированно не перекрывается scroll'ящимся контентом сверху —
     * это flex shrink-0 sibling content'а, не sticky. Используется для
     * «Подобрать оборудование», «Открыть корзину» и т.д.
     */
    footer?: ReactNode;
    className?: string;
};

/**
 * Native-style bottom sheet (mobile) / centered modal (sm+).
 *
 * Mobile-only фичи (sm-down):
 * - Drag handle сверху (тонкая полоска) — visual hint что можно дёрнуть
 * - Swipe-down to dismiss: pointer-events follow Y, при release > 100px
 *   → `onClose()`. Транзишен отключается на время drag для плавного follow.
 *
 * На sm+ это centered modal — drag handle и swipe не используются (DialogPanel
 * имеет sm:scale-down transition). Скрываем drag handle через `sm:hidden`.
 */
export function BottomSheetModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className,
}: TBottomSheetModalProps) {
    // Drag-to-dismiss state (только mobile bottom-sheet).
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartY = useRef<number | null>(null);

    const handleDragStart = (e: React.PointerEvent) => {
        if (!e.isPrimary) return;
        dragStartY.current = e.clientY;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const handleDragMove = (e: React.PointerEvent) => {
        if (dragStartY.current === null) return;
        const delta = e.clientY - dragStartY.current;
        setDragOffset(Math.max(0, Math.min(delta, window.innerHeight * 0.8)));
    };
    const handleDragEnd = (e: React.PointerEvent) => {
        if (dragStartY.current === null) return;
        const delta = e.clientY - dragStartY.current;
        dragStartY.current = null;
        setDragOffset(0);
        if (delta > 100) onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition duration-200 ease-out data-closed:opacity-0"
            />
            <div className="fixed inset-0 flex items-end sm:items-center sm:justify-center sm:p-4">
                <DialogPanel
                    transition
                    className={cn(
                        'flex flex-col w-full max-h-[85dvh] bg-base-100 rounded-t-2xl data-closed:translate-y-full sm:max-w-md sm:rounded-2xl sm:data-closed:translate-y-0 sm:data-closed:scale-95 sm:data-closed:opacity-0 overflow-hidden',
                        dragOffset > 0 ? '' : 'transition duration-200 ease-out',
                        className,
                    )}
                    style={
                        dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined
                    }
                >
                    {/* Drag handle — mobile only. Touch area расширена через py-2.5
                        (~28px tappable region) — тонкая визуальная полоска
                        остаётся, но пальцем удобно попасть.
                        aria-hidden + без role=button — drag это input-modality
                        affordance; для keyboard есть X в header / Esc / backdrop tap
                        (Headless UI Dialog). */}
                    <div
                        className="sm:hidden flex justify-center py-2.5 cursor-grab active:cursor-grabbing touch-none shrink-0"
                        onPointerDown={handleDragStart}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onPointerCancel={handleDragEnd}
                        aria-hidden="true"
                    >
                        <span className="block w-12 h-1 rounded-full bg-base-content/30" />
                    </div>

                    {title !== undefined && (
                        <header className="shrink-0 flex items-center justify-between gap-2 px-4 pb-4 sm:pt-4 border-b border-base-300">
                            <DialogTitle
                                as="h3"
                                className="font-bold text-lg leading-6 min-w-0 truncate"
                            >
                                {title}
                            </DialogTitle>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-square -mr-1 shrink-0"
                                aria-label="Закрыть"
                                onClick={onClose}
                            >
                                <XMarkIcon className="size-5" />
                            </button>
                        </header>
                    )}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col gap-4 p-4 min-w-0"
                        style={
                            footer
                                ? undefined
                                : { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }
                        }
                    >
                        {children}
                    </div>
                    {footer && (
                        <div
                            className="shrink-0 border-t border-base-300 bg-base-100 px-4 pt-3"
                            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                        >
                            {footer}
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    );
}
