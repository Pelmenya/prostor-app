import { notFound } from 'next/navigation';
import { fetchCurrentPolicy } from '@/entities/privacy-policy';
import { LegalDocumentPage } from '@/views/legal-document';

export const revalidate = 3600;

export default async function PrivacyPolicyRoute() {
    const document = await fetchCurrentPolicy().catch(() => null);

    if (!document) notFound();

    return <LegalDocumentPage title="Политика конфиденциальности" document={document} />;
}
