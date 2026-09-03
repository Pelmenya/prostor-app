import type { TLegalDocument } from '@/shared/model';
import { PageContainer, LegalMarkdown, LegalDocumentMeta } from '@/shared/ui';

type TProps = {
    title: string;
    document: TLegalDocument;
};

export function LegalDocumentPage({ title, document }: TProps) {
    return (
        <PageContainer>
            <article className="max-w-2xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold gradient-text mb-6">{title}</h1>

                <LegalDocumentMeta document={document} className="mb-6" />

                <LegalMarkdown content={document.content} />
            </article>
        </PageContainer>
    );
}
