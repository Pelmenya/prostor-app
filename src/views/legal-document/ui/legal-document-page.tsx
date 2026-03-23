import type { TLegalDocument } from '@/shared/model';
import { PageContainer, LegalMarkdown } from '@/shared/ui';

type TProps = {
    title: string;
    document: TLegalDocument;
};

export function LegalDocumentPage({ title, document }: TProps) {
    return (
        <PageContainer>
            <article className="max-w-2xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold gradient-text mb-6">{title}</h1>

                <div className="alert alert-info mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Версия: {document.version}</span>
                        <span className="text-xs">
                            Действует с:{' '}
                            {new Date(document.effectiveDate).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                </div>

                <LegalMarkdown content={document.content} />
            </article>
        </PageContainer>
    );
}
