import { CuratorAccessGate } from '@/features/curator-access-gate';
import { CuratorDrawerLayout } from '@/widgets/curator-sidebar';

export default function CuratorLayout({ children }: { children: React.ReactNode }) {
    return (
        <CuratorAccessGate>
            <CuratorDrawerLayout>{children}</CuratorDrawerLayout>
        </CuratorAccessGate>
    );
}
