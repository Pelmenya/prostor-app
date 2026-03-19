'use client';

import { useRouter } from 'next/navigation';

type TFooterItemProps = {
    to: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    indicator?: number;
};

export function FooterItem({ to, icon, label, isActive, indicator }: TFooterItemProps) {
    const router = useRouter();

    const handleClick = () => {
        if (isActive) return;
        router.push(to);
    };

    return (
        <li className={`${isActive ? 'dock-active' : ''} transition-none`} onClick={handleClick}>
            <div className="indicator size-[1.2em]">
                {icon}
                {indicator !== undefined && indicator > 0 && (
                    <span className="indicator-item badge badge-xs badge-warning">{indicator}</span>
                )}
            </div>
            <span className="dock-label">{label}</span>
        </li>
    );
}
