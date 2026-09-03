import ReactMarkdown from 'react-markdown';

// SECURITY: НЕ добавлять rehype-raw — контент с бэкенда, возможен XSS
const ALLOWED_ELEMENTS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'];

function MdH1({ compact, ...props }: React.ComponentProps<'h1'> & { compact?: boolean }) {
    return (
        <h1
            className={`${compact ? 'text-lg' : 'text-xl'} font-bold mb-4 text-primary`}
            {...props}
        />
    );
}
function MdH2({ compact, ...props }: React.ComponentProps<'h2'> & { compact?: boolean }) {
    return (
        <h2
            className={`${compact ? 'text-base' : 'text-lg'} font-semibold mt-6 mb-3 text-primary`}
            {...props}
        />
    );
}
function MdH3({ compact, ...props }: React.ComponentProps<'h3'> & { compact?: boolean }) {
    return (
        <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold mt-4 mb-2`} {...props} />
    );
}
function MdP({ compact, ...props }: React.ComponentProps<'p'> & { compact?: boolean }) {
    return <p className={`mb-3 leading-relaxed ${compact ? 'text-sm' : ''}`} {...props} />;
}
function MdUl(props: React.ComponentProps<'ul'>) {
    return <ul className="list-disc ml-4 mb-3 space-y-2" {...props} />;
}
function MdOl(props: React.ComponentProps<'ol'>) {
    return <ol className="list-decimal ml-4 mb-3 space-y-2" {...props} />;
}
function MdLi({ compact, ...props }: React.ComponentProps<'li'> & { compact?: boolean }) {
    return <li className={`mb-1 leading-relaxed ${compact ? 'text-sm' : ''}`} {...props} />;
}
function MdStrong(props: React.ComponentProps<'strong'>) {
    return <strong className="font-semibold text-primary" {...props} />;
}
function MdA(props: React.ComponentProps<'a'>) {
    return <a className="link text-primary" target="_blank" rel="noopener noreferrer" {...props} />;
}

function createMarkdownComponents(compact: boolean) {
    return {
        h1: (props: React.ComponentProps<'h1'>) => <MdH1 compact={compact} {...props} />,
        h2: (props: React.ComponentProps<'h2'>) => <MdH2 compact={compact} {...props} />,
        h3: (props: React.ComponentProps<'h3'>) => <MdH3 compact={compact} {...props} />,
        p: (props: React.ComponentProps<'p'>) => <MdP compact={compact} {...props} />,
        ul: MdUl,
        ol: MdOl,
        li: (props: React.ComponentProps<'li'>) => <MdLi compact={compact} {...props} />,
        strong: MdStrong,
        a: MdA,
    } satisfies React.ComponentProps<typeof ReactMarkdown>['components'];
}

const COMPONENTS_FULL = createMarkdownComponents(false);
const COMPONENTS_COMPACT = createMarkdownComponents(true);

type TProps = {
    content: string;
    compact?: boolean;
};

export function LegalMarkdown({ content, compact = false }: TProps) {
    return (
        <div className="prose prose-sm max-w-none">
            <ReactMarkdown
                allowedElements={ALLOWED_ELEMENTS}
                components={compact ? COMPONENTS_COMPACT : COMPONENTS_FULL}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
