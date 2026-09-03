'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { CuratorSidebar } from './curator-sidebar';

type TCuratorDrawerLayoutProps = {
    children: React.ReactNode;
};

export function CuratorDrawerLayout({ children }: TCuratorDrawerLayoutProps) {
    return (
        <div className="drawer lg:drawer-open grow">
            <input id="curator-drawer" type="checkbox" className="drawer-toggle" />

            <div className="drawer-content flex flex-col">
                <div className="lg:hidden flex items-center gap-3 bg-base-100 border-b border-base-content/10 px-4 py-3 shrink-0">
                    <label
                        htmlFor="curator-drawer"
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label="Открыть меню"
                    >
                        <Bars3Icon className="size-5" />
                    </label>
                    <span className="font-bold gradient-text">PROSTOR</span>
                </div>

                <main className="flex-1 min-h-0 flex flex-col bg-base-200 overflow-auto has-[[data-chat-page]]:overflow-hidden">
                    {children}
                </main>
            </div>

            <div className="drawer-side z-50">
                <label
                    htmlFor="curator-drawer"
                    aria-label="Закрыть меню"
                    className="drawer-overlay"
                />
                <CuratorSidebar />
            </div>
        </div>
    );
}
