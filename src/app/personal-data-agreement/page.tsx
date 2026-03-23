import { fetchCurrentAgreement } from '@/entities/personal-data-agreement';
import { LegalDocumentPage } from '@/views/legal-document';

export const revalidate = 3600;

export default async function PersonalDataAgreementRoute() {
    const document = await fetchCurrentAgreement();

    return (
        <LegalDocumentPage title="Согласие на обработку персональных данных" document={document} />
    );
}
