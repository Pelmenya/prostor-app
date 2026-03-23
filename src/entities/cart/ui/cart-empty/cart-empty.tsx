import Image from 'next/image';
import Link from 'next/link';

export function CartEmpty() {
    return (
        <div className="flex size-full flex-col items-center justify-start gap-4">
            <Image
                src="/assets/cart/cart-is-empty.png"
                alt="Пустая корзина"
                width={512}
                height={160}
                className="h-40 w-full max-w-lg rounded-2xl object-cover"
            />
            <div className="space-y-4 text-center">
                <h2 className="text-lg font-bold text-primary">Ваша корзина пуста</h2>
                <p className="text-sm text-base-content">
                    Перейдите в{' '}
                    <Link href="/catalog" className="link link-primary">
                        каталог
                    </Link>
                    , чтобы начать покупки
                </p>
            </div>
        </div>
    );
}
