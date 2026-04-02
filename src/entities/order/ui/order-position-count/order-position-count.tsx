type TOrderPositionCountProps = {
    count: number;
};

export function OrderPositionCount({ count }: TOrderPositionCountProps) {
    return (
        <p className="bg-base-200 p-2 text-ex-min rounded-xs whitespace-nowrap">
            {count} шт.
        </p>
    );
}
