import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { RegisterSW } from '@/features/push-notifications';
import { CartSyncProvider } from '@/features/cart';
import { SearchModalMount } from '@/features/product-search';
import { SessionExpiredListener, RegistrationNoticeListener } from '@/features/auth';

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RegisterSW />
            <CartSyncProvider />
            <SessionExpiredListener />
            <RegistrationNoticeListener />
            <div className="flex flex-col w-full h-dvh border border-base-content/10 bg-base-100">
                <Header />
                {/* `has-[[data-fullscreen-map]]` — если внутри есть fullscreen
                    page (например /water), main блокирует scroll через
                    overflow-hidden. На остальных страницах scroll работает
                    как обычно с overscroll-contain (без rubber-band за края).
                    `flex flex-col` (от Петра, PR #47) — нужен для grow-цепочки
                    PageContainer чтобы серый фон тянулся на весь экран при
                    коротком контенте. На /water flex-col безвреден (контент
                    абсолютно позиционирован). */}
                <main className="flex-1 flex flex-col overflow-y-auto overscroll-contain has-[[data-fullscreen-map]]:overflow-hidden has-[[data-fullscreen-map]]:overscroll-none has-[[data-chat-page]]:overflow-hidden">
                    {children}
                </main>
                <Footer />
            </div>
            <SearchModalMount />
        </>
    );
}
