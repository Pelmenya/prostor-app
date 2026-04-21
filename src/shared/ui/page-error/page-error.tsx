'use client';

import { PageContainer } from '../page-container';

type TPageErrorProps = {
    message?: string;
    onRetry?: () => void;
};

export function PageError({ message = 'Ошибка загрузки данных', onRetry }: TPageErrorProps) {
    return (
        <PageContainer className="flex flex-col items-center justify-center gap-4">
            <p className="text-error font-medium">{message}</p>
            {onRetry && (
                <button type="button" onClick={onRetry} className="btn btn-primary btn-sm">
                    Попробовать снова
                </button>
            )}
        </PageContainer>
    );
}
