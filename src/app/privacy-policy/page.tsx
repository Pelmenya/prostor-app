import { fetchCurrentPolicy } from '@/entities/privacy-policy';
import { LegalDocumentPage } from '@/views/legal-document';

export const revalidate = 3600;

export default async function PrivacyPolicyRoute() {
    const document = await fetchCurrentPolicy();

    return <LegalDocumentPage title="Политика конфиденциальности" document={document} />;
}
