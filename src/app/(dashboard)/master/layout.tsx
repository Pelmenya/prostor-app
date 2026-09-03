import { MasterAccessGate } from '@/features/master-access-gate';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
    return <MasterAccessGate>{children}</MasterAccessGate>;
}
