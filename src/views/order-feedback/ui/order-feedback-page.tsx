'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useGetMyOrderFeedback,
    useCreateOrderFeedback,
    useUpdateOrderFeedback,
    FeedbackForm,
    FeedbackSummaryCard,
} from '@/entities/order-feedback';
import { useGetOrderById } from '@/entities/order';
import { ConfirmDialog, PageContainer, PageTitle } from '@/shared/ui';
import type { TParameters } from '@/entities/order-feedback';

type TOrderFeedbackPageProps = {
    orderId: number;
};

export function OrderFeedbackPage({ orderId }: TOrderFeedbackPageProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { data: order, isLoading: isOrderLoading } = useGetOrderById(orderId);
    const { data: myFeedback, isLoading: isFeedbackLoading } = useGetMyOrderFeedback(orderId);
    const { mutate: createFeedback, isPending: isCreating } = useCreateOrderFeedback();
    const { mutate: updateFeedback, isPending: isUpdating } = useUpdateOrderFeedback();

    if (isOrderLoading || isFeedbackLoading) {
        return (
            <PageContainer className="flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </PageContainer>
        );
    }

    const handleCreate = ({
        parameters,
        comment,
    }: {
        parameters: TParameters;
        comment: string;
    }) => {
        if (!order?.executor) return;
        createFeedback(
            { orderId, executorId: order.executor.id, clientParameters: parameters, comment },
            { onSuccess: () => setConfirmOpen(true) },
        );
    };

    const handleUpdate = ({
        parameters,
        comment,
    }: {
        parameters: TParameters;
        comment: string;
    }) => {
        if (!myFeedback) return;
        updateFeedback(
            { feedbackId: myFeedback.id, orderId, clientParameters: parameters, comment },
            { onSuccess: () => setIsEditing(false) },
        );
    };

    if (myFeedback && !isEditing) {
        return (
            <PageContainer>
                <PageTitle className="mb-4">Отзыв о мастере</PageTitle>
                <div className="max-w-lg mx-auto w-full">
                    <FeedbackSummaryCard
                        parameters={myFeedback.clientParameters}
                        comment={myFeedback.comment}
                        onEdit={() => setIsEditing(true)}
                    />
                </div>
            </PageContainer>
        );
    }

    if (myFeedback && isEditing) {
        return (
            <PageContainer>
                <PageTitle className="mb-4">Редактировать отзыв</PageTitle>
                <div className="max-w-lg mx-auto w-full">
                    <FeedbackForm
                        isSubmitting={isUpdating}
                        onSubmit={handleUpdate}
                        initialParameters={myFeedback.clientParameters}
                        initialComment={myFeedback.comment ?? ''}
                        submitLabel="Сохранить"
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageTitle className="mb-4">Оцените мастера</PageTitle>
            <div className="max-w-lg mx-auto w-full">
                <FeedbackForm isSubmitting={isCreating} onSubmit={handleCreate} />
            </div>
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => {
                    setConfirmOpen(false);
                    router.push(`/orders/${orderId}`);
                }}
                onConfirm={() => {
                    setConfirmOpen(false);
                    router.push(`/orders/${orderId}`);
                }}
                title="Спасибо за отзыв!"
                message="Ваш отзыв успешно отправлен."
                confirmText="Закрыть"
            />
        </PageContainer>
    );
}
