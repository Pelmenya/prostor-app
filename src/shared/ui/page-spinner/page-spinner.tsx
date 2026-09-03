import { PageContainer } from '../page-container';

export function PageSpinner() {
    return (
        <PageContainer className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary" />
        </PageContainer>
    );
}
