export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col w-full min-h-dvh bg-base-200 has-[[data-chat-page]]:h-dvh has-[[data-chat-page]]:overflow-hidden">
            {children}
        </div>
    );
}
