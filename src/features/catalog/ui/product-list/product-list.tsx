import type { TProduct } from '@/entities/product';
import { ProductCard } from '../product-card';

type TProductListProps = {
    products: TProduct[];
};

export function ProductList({ products }: TProductListProps) {
    if (products.length === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

export function ProductListSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col gap-4 p-4 bg-base-200 rounded-2xl min-h-[286px]"
                >
                    <div className="skeleton w-full h-[106px] shrink-0" />
                    <div className="flex flex-col justify-between size-full">
                        <div className="flex flex-col gap-2">
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6" />
                            <div className="skeleton h-3 w-full" />
                            <div className="skeleton h-3 w-4/5" />
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                            <div className="skeleton h-5 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
