import { StarIcon } from '@heroicons/react/20/solid';

type TStarRatingProps = {
    avgRating?: number;
};

export function StarRating({ avgRating }: TStarRatingProps) {
    if (!avgRating || avgRating === 0) {
        return <span className="text-xs">Нет рейтинга</span>;
    }

    const rating = Math.min(Math.max(avgRating, 0), 5);

    const stars = Array.from({ length: 5 }, (_, index) => {
        const fillPercentage = Math.min(Math.max((rating - index) * 100, 0), 100);
        return { id: index + 1, fillPercentage };
    });

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {stars.map((star) => (
                    <div key={star.id} className="relative size-4">
                        <StarIcon className="absolute size-4 text-warning/20" />
                        <div
                            className="absolute overflow-hidden"
                            style={{ width: `${star.fillPercentage}%`, height: '100%' }}
                        >
                            <StarIcon className="size-4 text-warning" />
                        </div>
                    </div>
                ))}
            </div>
            <span className="text-xs font-semibold text-warning leading-[150%] mt-0.5">
                {rating.toLocaleString('ru-RU', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                })}
            </span>
        </div>
    );
}
