import { QueryProvider } from '@/shared/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <div className="flex flex-col w-full min-h-dvh bg-base-200">{children}</div>
        </QueryProvider>
    );
}
