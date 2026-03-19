import { QueryProvider } from '@/shared/api';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';

// TODO: добавить SessionProvider (NextAuth) когда бэкенд будет готов

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <div className="flex flex-col w-full h-dvh border border-base-content/10 bg-base-100">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-10">{children}</main>
                <Footer />
            </div>
        </QueryProvider>
    );
}
