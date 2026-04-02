import { formatPrice } from '@/shared/lib';

type TVisitPriceBlockProps = {
    isLoading: boolean;
    clientVisitPrice?: { totalPrice: number; distanceKm: number; departureName: string };
    minVisitPrice?: number;
};

export function VisitPriceBlock({
    isLoading,
    clientVisitPrice,
    minVisitPrice,
}: TVisitPriceBlockProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="loading loading-spinner loading-xs" />
                Рассчитываем стоимость выезда...
            </div>
        );
    }
    if (clientVisitPrice) {
        return (
            <div className="rounded-xl bg-base-100 p-3 text-sm">
                <div className="flex justify-between">
                    <span>Выезд к клиенту ({clientVisitPrice.distanceKm} км)</span>
                    <span className="font-semibold text-primary">
                        {formatPrice(clientVisitPrice.totalPrice)}
                    </span>
                </div>
                <p className="text-xs opacity-60 mt-1">от: {clientVisitPrice.departureName}</p>
            </div>
        );
    }
    if (minVisitPrice !== undefined) {
        return (
            <div className="rounded-xl bg-base-100 p-3 text-sm">
                <div className="flex justify-between">
                    <span>Выезд к клиенту</span>
                    <span className="font-semibold text-primary">
                        от {formatPrice(minVisitPrice)}
                    </span>
                </div>
                <p className="text-xs opacity-60 mt-1">Точная стоимость зависит от мастера</p>
            </div>
        );
    }
    return null;
}
