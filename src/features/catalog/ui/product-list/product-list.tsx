import type { TProduct } from '@/entities/product';
import { ProductCard } from '../product-card';

type TProductListProps = {
    products: TProduct[];
};

export function ProductList({ products }: TProductListProps) {
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
                <div key={i} className="flex flex-col gap-2 rounded-2xl bg-base-200 p-3">
                    <div className="skeleton aspect-square rounded-xl" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}
