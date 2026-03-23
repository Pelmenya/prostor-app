import { notFound } from 'next/navigation';
import { fetchCurrentAgreement } from '@/entities/personal-data-agreement';
import { LegalDocumentPage } from '@/views/legal-document';

export const revalidate = 3600;

export default async function PersonalDataAgreementRoute() {
    const document = await fetchCurrentAgreement().catch(() => null);

    if (!document) notFound();

    return (
        <LegalDocumentPage title="Согласие на обработку персональных данных" document={document} />
    );
}
