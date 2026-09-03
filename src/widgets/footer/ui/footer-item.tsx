import Link from 'next/link';

type TFooterItemProps = {
    to: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    indicator?: number;
};

export function FooterItem({ to, icon, label, isActive, indicator }: TFooterItemProps) {
    return (
        <li className={`${isActive ? 'dock-active' : ''} transition-none`}>
            <Link href={to} className="flex flex-col items-center gap-0.5">
                <div className="indicator size-[1.2em]">
                    {icon}
                    {indicator !== undefined && indicator > 0 && (
                        <span className="indicator-item badge badge-xs badge-warning">
                            {indicator}
                        </span>
                    )}
                </div>
                <span className="dock-label">{label}</span>
            </Link>
        </li>
    );
}
