import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';
import { EServiceCategory as ServiceCategory } from '@/shared/model';
import type { TOrderCartState } from '../../model/types/t-order';
import { groupOrderPositions } from '../../lib/group-order-positions';
import { ProductsSection } from './products-section';
import { ServicesSection } from './services-section';

type TOrderPositionsListProps = {
    cartState: TOrderCartState;
    imageUrls?: Record<string, string | undefined>;
    loadingIds?: Set<string>;
};

export function OrderPositionsList({ cartState, imageUrls, loadingIds }: TOrderPositionsListProps) {
    const { items, hasProducts, hasInstallation, hasMaintenance, hasGeneral } =
        groupOrderPositions(cartState);

    if (!items.length) return null;

    return (
        <div className="flex flex-col w-full gap-6">
            {hasProducts && (
                <ProductsSection items={items} imageUrls={imageUrls} loadingIds={loadingIds} />
            )}

            {hasInstallation && (
                <ServicesSection
                    items={items}
                    category={ServiceCategory.MONTAZH}
                    label="Монтаж"
                    icon={<WrenchScrewdriverIcon className="size-3" />}
                />
            )}

            {hasMaintenance && (
                <ServicesSection
                    items={items}
                    category={ServiceCategory.SERVISNOE_OBSLUZHIVANIE}
                    label="Сервис"
                    icon={<ArrowPathRoundedSquareIcon className="size-3" />}
                />
            )}

            {hasGeneral && (
                <ServicesSection
                    items={items}
                    category={undefined}
                    label="Услуги"
                    icon={<WrenchScrewdriverIcon className="size-3" />}
                />
            )}
        </div>
    );
}
