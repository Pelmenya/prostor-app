import { QueryProvider } from '@/shared/api';

// TODO: добавить SessionProvider (NextAuth) когда бэкенд будет готов

export default function WebLayout({ children }: { children: React.ReactNode }) {
    return <QueryProvider>{children}</QueryProvider>;
}
