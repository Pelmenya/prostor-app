'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    useGetOrderById,
    useUpdateOrderStatus,
    getServiceInfo,
    EOrderStatus,
    OrderReadonlyItems,
} from '@/entities/order';
import { useProductThumbnails } from '@/entities/product';
import { formatPrice, formatDateRu } from '@/shared/lib';
import { EServiceCategory } from '@/shared/model';
import { BottomSheetModal, CardImage, ConfirmDialog, PageContainer, PageTitle } from '@/shared/ui';
import {
    CheckCircleIcon,
    CubeIcon,
    HomeIcon,
    MapPinIcon,
    ShoppingCartIcon,
    TruckIcon,
} from '@heroicons/react/24/solid';
import { WrenchScrewdriverIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/16/solid';

const STATUS_STEP: Record<EOrderStatus, number> = {
    [EOrderStatus.PENDING]: 1,
    [EOrderStatus.CONFIRMED]: 2,
    [EOrderStatus.IN_PROGRESS]: 3,
    [EOrderStatus.COMPLETED]: 4,
    [EOrderStatus.CANCELLED]: 0,
};

const STATUS_LABEL: Record<EOrderStatus, { text: string; className: string }> = {
    [EOrderStatus.PENDING]: { text: 'Создан', className: '' },
    [EOrderStatus.CONFIRMED]: { text: 'Подтверждён', className: '' },
    [EOrderStatus.IN_PROGRESS]: { text: 'Запланирован', className: '' },
    [EOrderStatus.COMPLETED]: { text: 'Выполнен', className: 'text-primary' },
    [EOrderStatus.CANCELLED]: { text: 'Отменен', className: 'text-error' },
};

const SERVICE_GROUPS = [
    { category: EServiceCategory.MONTAZH, variant: 'installation' as const },
    { category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE, variant: 'maintenance' as const },
    { category: undefined, variant: 'service' as const },
];

type TOrderDetailPageProps = {
    orderId: number;
};

export function OrderDetailPage({ orderId }: TOrderDetailPageProps) {
    const [isContentsOpen, setIsContentsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const { mutate: updateStatus, isPending: isCancelling } = useUpdateOrderStatus();

    const { data: order, isLoading, error } = useGetOrderById(orderId);

    const productIds = Object.keys(order?.cartState?.items ?? {});
    const { imageUrls, loadingIds } = useProductThumbnails(productIds);

    if (isLoading) return <p>Загрузка...</p>;
    if (error || !order) return <p>Ошибка загрузки заказа</p>;

    const items = Object.values(order.cartState.items ?? {});
    const isCancelled = order.status === EOrderStatus.CANCELLED;
    const isCompact = isCancelled || order.status === EOrderStatus.COMPLETED;

    return (
        <PageContainer>
            <PageTitle>Детали заказа №{order.id}</PageTitle>
            <div className="flex flex-col gap-4 pb-4 max-w-lg mx-auto w-full">
                {/* Состав заказа */}
                {!isCompact && (
                    <OrderReadonlyItems
                        items={order.cartState.items ?? {}}
                        imageUrls={imageUrls}
                        loadingIds={loadingIds}
                    />
                )}

                {/* Состав заказа компактный */}
                {isCompact && items.some((item) => item?.product && item.count > 0) && (
                    <>
                        <button
                            type="button"
                            onClick={() => setIsContentsOpen(true)}
                            className="relative flex flex-col gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full text-left cursor-pointer"
                        >
                            <div className="flex gap-3 flex-wrap">
                                {items
                                    .filter((item) => item?.product && item.count > 0)
                                    .flatMap((cartItem) => {
                                        const imgUrl = imageUrls[cartItem.product.id];
                                        const isImgLoading = loadingIds.has(cartItem.product.id);
                                        const imgProps = {
                                            src: imgUrl,
                                            isLoading: isImgLoading,
                                            className: 'h-16 w-12 rounded-2xl',
                                            imgClassName: 'size-full object-contain',
                                            alt: cartItem.product.name,
                                        };

                                        const serviceGroups: {
                                            category: EServiceCategory | undefined;
                                            icon: React.ReactNode;
                                        }[] = [
                                            {
                                                category: EServiceCategory.MONTAZH,
                                                icon: <WrenchScrewdriverIcon className="size-3" />,
                                            },
                                            {
                                                category: EServiceCategory.SERVISNOE_OBSLUZHIVANIE,
                                                icon: (
                                                    <ArrowPathRoundedSquareIcon className="size-3" />
                                                ),
                                            },
                                        ];

                                        return [
                                            <div
                                                key={`p-${cartItem.product.id}`}
                                                className="relative shrink-0"
                                            >
                                                <CardImage {...imgProps} />
                                            </div>,
                                            ...serviceGroups
                                                .filter(({ category }) =>
                                                    Object.values(cartItem.services ?? {}).some(
                                                        (s) =>
                                                            s.checked &&
                                                            s.count > 0 &&
                                                            getServiceInfo(s)?.category ===
                                                                category,
                                                    ),
                                                )
                                                .map(({ category, icon }) => (
                                                    <div
                                                        key={`svc-${cartItem.product.id}-${category}`}
                                                        className="relative shrink-0"
                                                    >
                                                        <CardImage {...imgProps} />
                                                        <div className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-primary text-primary-content">
                                                            {icon}
                                                        </div>
                                                    </div>
                                                )),
                                        ];
                                    })}
                            </div>
                        </button>

                        {/* Модалка содержимого заказа */}
                        <BottomSheetModal
                            isOpen={isContentsOpen}
                            onClose={() => setIsContentsOpen(false)}
                            title="Содержимое заказа"
                            className="max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex flex-col gap-3">
                                {items
                                    .filter((item) => item?.product && item.count > 0)
                                    .map((cartItem) => {
                                        const imgUrl = imageUrls[cartItem.product.id];
                                        const isImgLoading = loadingIds.has(cartItem.product.id);

                                        const activeServices = SERVICE_GROUPS.flatMap(
                                            ({ category, variant }) =>
                                                Object.entries(cartItem.services ?? {})
                                                    .filter(
                                                        ([, s]) =>
                                                            s.checked &&
                                                            s.count > 0 &&
                                                            getServiceInfo(s)?.category ===
                                                                category,
                                                    )
                                                    .map(([svcId, svc]) => ({
                                                        svcId,
                                                        svc,
                                                        variant,
                                                    })),
                                        );

                                        return (
                                            <div
                                                key={cartItem.product.id}
                                                className="flex flex-col gap-3"
                                            >
                                                {/* Товар */}
                                                <Link
                                                    href={`/product/${cartItem.product.id}`}
                                                    className="flex items-center gap-3"
                                                    onClick={() => setIsContentsOpen(false)}
                                                >
                                                    <CardImage
                                                        src={imgUrl}
                                                        isLoading={isImgLoading}
                                                        className="h-16 w-12 shrink-0 rounded-2xl"
                                                        imgClassName="size-full object-contain"
                                                        alt={cartItem.product.name}
                                                    />
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <p className="text-sm line-clamp-2 leading-[110%]">
                                                            {cartItem.product.name}
                                                        </p>
                                                        <p className="text-sm font-semibold text-primary leading-[110%]">
                                                            {formatPrice(cartItem.price)}
                                                        </p>
                                                    </div>
                                                </Link>

                                                {/* Услуги */}
                                                {activeServices.map(({ svcId, svc }) => {
                                                    const info = getServiceInfo(svc);
                                                    return (
                                                        <Link
                                                            key={svcId}
                                                            href={`/product/${cartItem.product.id}`}
                                                            className="flex items-center gap-3"
                                                            onClick={() => setIsContentsOpen(false)}
                                                        >
                                                            <div className="relative shrink-0">
                                                                <CardImage
                                                                    src={imgUrl}
                                                                    isLoading={isImgLoading}
                                                                    className="h-16 w-12 rounded-2xl"
                                                                    imgClassName="size-full object-contain"
                                                                    alt={cartItem.product.name}
                                                                />
                                                                <div className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-primary text-primary-content">
                                                                    {getServiceInfo(svc)
                                                                        ?.category ===
                                                                    EServiceCategory.MONTAZH ? (
                                                                        <WrenchScrewdriverIcon className="size-3" />
                                                                    ) : (
                                                                        <ArrowPathRoundedSquareIcon className="size-3" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <p className="text-sm line-clamp-2 leading-[110%]">
                                                                    {info?.name}
                                                                </p>
                                                                <p className="text-sm font-semibold text-primary leading-[110%]">
                                                                    {formatPrice(
                                                                        svc.price * svc.count,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                            </div>
                        </BottomSheetModal>
                    </>
                )}

                {/* Доставка */}
                {!isCancelled && (
                    <div className="relative flex justify-between gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                        <span className="font-medium text-sm leading-[110%]">Доставка</span>
                        {!!order.deliveryCost && order.deliveryCost > 0 ? (
                            <span className="text-primary font-semibold text-sm leading-[110%]">
                                {formatPrice(order.deliveryCost)}
                            </span>
                        ) : (
                            <span className="text-sm leading-[110%]">Уточняется</span>
                        )}
                    </div>
                )}

                {/* Статус */}
                <div className="relative flex flex-col gap-4 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                    {!isCompact && (
                        <>
                            <div className="flex gap-2">
                                <span className="font-semibold text-sm leading-[110%]">
                                    Дата доставки
                                </span>
                                <span className="text-sm leading-[110%]">
                                    {order.scheduledDate?.date
                                        ? `${formatDateRu(order.scheduledDate.date)} ${String(order.scheduledDate.startHour).padStart(2, '0')}:${String(order.scheduledDate.startMinute).padStart(2, '0')}`
                                        : 'Уточняется'}
                                </span>
                            </div>
                            <ul className="steps">
                                <li
                                    className={`step ${STATUS_STEP[order.status] >= 1 ? 'step-primary' : ''}`}
                                >
                                    <span className="step-icon">
                                        <ShoppingCartIcon className="shrink-0 size-5 text-base-100" />
                                    </span>
                                </li>
                                <li
                                    className={`step ${STATUS_STEP[order.status] >= 2 ? 'step-primary' : ''}`}
                                >
                                    <span className="step-icon">
                                        <CubeIcon className="shrink-0 size-5" />
                                    </span>
                                </li>
                                <li
                                    className={`step ${STATUS_STEP[order.status] >= 3 ? 'step-primary' : ''}`}
                                >
                                    <span className="step-icon">
                                        <TruckIcon className="shrink-0 size-5" />
                                    </span>
                                </li>
                                <li
                                    className={`step ${STATUS_STEP[order.status] >= 4 ? 'step-primary' : ''}`}
                                >
                                    <span className="step-icon">
                                        <CheckCircleIcon className="shrink-0 size-5" />
                                    </span>
                                </li>
                            </ul>
                            <hr className="h-px text-base-300" />
                        </>
                    )}

                    <div className="flex justify-between">
                        <span
                            className={`text-sm leading-[110%] ${STATUS_LABEL[order.status].className}`}
                        >
                            {STATUS_LABEL[order.status].text}
                        </span>
                        <span className="font-medium text-sm leading-[110%] opacity-60">
                            {new Date(
                                order.status === EOrderStatus.PENDING
                                    ? order.createdAt
                                    : order.updatedAt,
                            ).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {!isCancelled && (
                    <>
                        {/* Адрес самовывоза */}
                        {order.pickupStore && order.status !== EOrderStatus.COMPLETED && (
                            <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                                <MapPinIcon className="size-6" />
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm leading-[110%]">
                                        Адрес самовывоза
                                    </span>
                                    <span className="text-sm leading-[110%]">
                                        {order.pickupStore.address}
                                        {order.pickupStore.phone && (
                                            <p>Тел: {order.pickupStore.phone}</p>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Адрес установки */}
                        <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                            <HomeIcon className="size-6" />
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm leading-[110%]">Адрес</span>
                                <span className="text-sm leading-[110%]">
                                    {order.realEstate.address}
                                </span>
                            </div>
                        </div>

                        {/* Исполнитель */}
                        {order.executor && (
                            <div className="relative flex items-center gap-2 p-4 bg-base-100 border border-base-300 rounded-2xl w-full">
                                <div></div>
                                <span>{order.executor.first_name}</span>
                                <span>{order.executor.last_name}</span>
                            </div>
                        )}
                    </>
                )}

                {/* Кнопки */}
                <div className="flex gap-4">
                    {order.status === EOrderStatus.COMPLETED ? (
                        order.executor && (
                            <button className="flex-1 btn btn-md btn-primary">
                                Оценить мастера
                            </button>
                        )
                    ) : (
                        <>
                            <button className="flex-1 btn btn-md btn-primary">Задать вопрос</button>
                            <button
                                className="flex-1 btn btn-md btn-error btn-outline"
                                disabled={isCancelled}
                                onClick={() => setIsCancelOpen(true)}
                            >
                                Отменить
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={isCancelOpen}
                onClose={() => setIsCancelOpen(false)}
                onConfirm={() =>
                    updateStatus(
                        { orderId, status: EOrderStatus.CANCELLED },
                        { onSuccess: () => setIsCancelOpen(false) },
                    )
                }
                title="Отменить заказ?"
                message={`Заказ №${orderId} будет отменен. Это действие необратимо`}
                confirmText={isCancelling ? 'Подождите...' : 'Да, отменить'}
                cancelText="Назад"
            />
        </PageContainer>
    );
}
