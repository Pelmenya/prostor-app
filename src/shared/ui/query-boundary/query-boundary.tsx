'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense, type ReactNode } from 'react';
import { PageSpinner } from '../page-spinner/page-spinner';
import { PageError } from '../page-error/page-error';

type TQueryBoundaryProps = {
    children: ReactNode;
    errorMessage?: string;
    resetKeys?: unknown[];
    fallback?: ReactNode;
};

export function QueryBoundary({
    children,
    errorMessage,
    resetKeys,
    fallback,
}: TQueryBoundaryProps) {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary
                    onReset={reset}
                    resetKeys={resetKeys}
                    fallbackRender={({ resetErrorBoundary }) => (
                        <PageError message={errorMessage} onRetry={resetErrorBoundary} />
                    )}
                >
                    <Suspense fallback={fallback ?? <PageSpinner />}>{children}</Suspense>
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
}
