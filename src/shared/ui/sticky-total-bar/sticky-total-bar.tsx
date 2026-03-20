import Link from 'next/link';
import { formatPrice } from '@/shared/lib';

export type TLineItem = {
    label: string;
    count?: number;
    total: number;
};

type TStickyTotalBarProps = {
    grandTotal: number;
    lines: TLineItem[];
    actionLink: string;
    actionLabel: string;
    onAction?: () => void;
    disabled?: boolean;
};

export function StickyTotalBar({
    grandTotal,
    lines,
    actionLink,
    actionLabel,
    onAction,
    disabled = false,
}: TStickyTotalBarProps) {
    if (lines.length === 0) return null;

    return (
        <div className="absolute w-full h-19 flex justify-between items-center py-2 px-4 bg-base-100 left-0 z-12 border-t border-base-content/10 shadow-sm-top lg:justify-end lg:gap-4 bottom-0">
            <div className="flex text-xs items-center">
                <div className="flex flex-col gap-1 text-primary md:flex-row">
                    <span className="uppercase">Итого:</span>
                    <span className="font-bold">{formatPrice(grandTotal)}</span>
                </div>
                <div className="divider divider-horizontal m-0" />
                <div className="flex flex-col md:flex-row md:gap-2">
                    {lines.map((line) => (
                        <div key={line.label} className="flex gap-2 justify-between">
                            <span className="opacity-70">
                                {line.label}
                                {line.count !== undefined ? ` (${line.count})` : ''}:
                            </span>
                            <span className="font-bold">{formatPrice(line.total)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {onAction ? (
                <button className="btn btn-sm btn-primary" onClick={onAction} disabled={disabled}>
                    {actionLabel}
                </button>
            ) : (
                <Link
                    href={actionLink}
                    className={`btn btn-sm btn-primary ${disabled ? 'btn-disabled' : ''}`}
                    aria-disabled={disabled}
                    tabIndex={disabled ? -1 : undefined}
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
