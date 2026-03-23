import ReactMarkdown from 'react-markdown';
import type { TLegalDocument } from '@/shared/model';
import { PageContainer } from '@/shared/ui';

// SECURITY: НЕ добавлять rehype-raw — контент с бэкенда, возможен XSS
const ALLOWED_ELEMENTS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'];

function MdH1(props: React.ComponentProps<'h1'>) {
    return <h1 className="text-xl font-bold mb-4 text-primary" {...props} />;
}
function MdH2(props: React.ComponentProps<'h2'>) {
    return <h2 className="text-lg font-semibold mt-6 mb-3 text-primary" {...props} />;
}
function MdH3(props: React.ComponentProps<'h3'>) {
    return <h3 className="text-base font-semibold mt-4 mb-2" {...props} />;
}
function MdP(props: React.ComponentProps<'p'>) {
    return <p className="mb-3 leading-relaxed" {...props} />;
}
function MdUl(props: React.ComponentProps<'ul'>) {
    return <ul className="list-disc ml-4 mb-3 space-y-2" {...props} />;
}
function MdOl(props: React.ComponentProps<'ol'>) {
    return <ol className="list-decimal ml-4 mb-3 space-y-2" {...props} />;
}
function MdLi(props: React.ComponentProps<'li'>) {
    return <li className="mb-1 leading-relaxed" {...props} />;
}
function MdStrong(props: React.ComponentProps<'strong'>) {
    return <strong className="font-semibold text-primary" {...props} />;
}
function MdA(props: React.ComponentProps<'a'>) {
    return <a className="link text-primary" target="_blank" rel="noopener noreferrer" {...props} />;
}

const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h1: MdH1,
    h2: MdH2,
    h3: MdH3,
    p: MdP,
    ul: MdUl,
    ol: MdOl,
    li: MdLi,
    strong: MdStrong,
    a: MdA,
};

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

                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                        allowedElements={ALLOWED_ELEMENTS}
                        components={MARKDOWN_COMPONENTS}
                    >
                        {document.content}
                    </ReactMarkdown>
                </div>
            </article>
        </PageContainer>
    );
}
