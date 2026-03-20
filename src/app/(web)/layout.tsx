import { QueryProvider } from '@/shared/api';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';

// TODO: добавить SessionProvider (NextAuth) когда бэкенд будет готов

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            {/* Паддинги страницы задаёт PageContainer — каждая view ДОЛЖНА его использовать */}
            <div className="flex flex-col w-full h-dvh border border-base-content/10 bg-base-100">
                <Header />
                <main className="flex-1 overflow-y-auto">{children}</main>
                <Footer />
            </div>
        </QueryProvider>
    );
}
