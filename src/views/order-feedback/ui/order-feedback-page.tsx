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
import { useGetOrderById, EOrderStatus } from '@/entities/order';
import { useAuth } from '@/shared/lib/platform';
import { PageContainer, PageTitle } from '@/shared/ui';
import type { TOrderFeedbackParameters } from '@/entities/order-feedback';

type TOrderFeedbackPageProps = {
    orderId: number;
};

type TFeedbackSuccessDialogProps = {
    onClose: () => void;
};

function FeedbackSuccessDialog({ onClose }: TFeedbackSuccessDialogProps) {
    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Спасибо за отзыв!</h3>
                <p className="py-4">Ваш отзыв успешно отправлен.</p>
                <div className="modal-action">
                    <button type="button" className="btn btn-primary" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}

export function OrderFeedbackPage({ orderId }: TOrderFeedbackPageProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { data: order, isLoading: isOrderLoading } = useGetOrderById(orderId, {
        enabled: isAuthenticated,
    });
    const { data: myFeedback, isLoading: isFeedbackLoading } = useGetMyOrderFeedback(orderId, {
        enabled: isAuthenticated,
    });
    const { mutate: createFeedback, isPending: isCreating } = useCreateOrderFeedback();
    const { mutate: updateFeedback, isPending: isUpdating } = useUpdateOrderFeedback();

    if (!isAuthenticated || isOrderLoading || isFeedbackLoading) {
        return (
            <PageContainer className="flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </PageContainer>
        );
    }

    const canLeaveFeedback = order?.status === EOrderStatus.COMPLETED && Boolean(order?.executor);

    if (order && !canLeaveFeedback) {
        return (
            <PageContainer>
                <PageTitle className="mb-4">Отзыв о мастере</PageTitle>
                <div className="max-w-lg mx-auto w-full">
                    <div className="alert alert-info">
                        Отзыв доступен только для выполненных заказов с назначенным мастером.
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost mt-4"
                        onClick={() => router.push(`/orders/${orderId}`)}
                    >
                        К заказу
                    </button>
                </div>
            </PageContainer>
        );
    }

    const handleCreate = ({
        parameters,
        comment,
    }: {
        parameters: TOrderFeedbackParameters;
        comment: string;
    }) => {
        if (!order?.executor) {
            setSubmitError('Исполнитель не назначен');
            return;
        }
        setSubmitError(null);
        createFeedback(
            { orderId, executorId: order.executor.id, clientParameters: parameters, comment },
            {
                onSuccess: () => setConfirmOpen(true),
                onError: () => setSubmitError('Не удалось отправить отзыв. Попробуйте ещё раз.'),
            },
        );
    };

    const handleUpdate = ({
        parameters,
        comment,
    }: {
        parameters: TOrderFeedbackParameters;
        comment: string;
    }) => {
        if (!myFeedback || !order?.executor) {
            setSubmitError('Исполнитель не назначен');
            return;
        }
        setSubmitError(null);
        updateFeedback(
            {
                feedbackId: myFeedback.id,
                orderId,
                executorId: order.executor.id,
                clientParameters: parameters,
                comment,
            },
            {
                onSuccess: () => setIsEditing(false),
                onError: () =>
                    setSubmitError('Не удалось сохранить изменения. Попробуйте ещё раз.'),
            },
        );
    };

    const handleConfirmClose = () => {
        setConfirmOpen(false);
        router.push(`/orders/${orderId}`);
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
                    {submitError && <div className="alert alert-error mb-4">{submitError}</div>}
                    <FeedbackForm
                        key={myFeedback.id}
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
                {submitError && <div className="alert alert-error mb-4">{submitError}</div>}
                <FeedbackForm isSubmitting={isCreating} onSubmit={handleCreate} />
            </div>

            {confirmOpen && <FeedbackSuccessDialog onClose={handleConfirmClose} />}
        </PageContainer>
    );
}
