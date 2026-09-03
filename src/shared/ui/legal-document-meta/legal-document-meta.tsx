import type { TLegalDocument } from '@/shared/model';
import { formatDateRu } from '@/shared/lib';

type TProps = {
    document: TLegalDocument;
    className?: string;
};

export function LegalDocumentMeta({ document, className }: TProps) {
    return (
        <div className={`alert alert-info ${className ?? ''}`}>
            <div className="flex flex-col gap-1">
                <span className="font-semibold">Версия: {document.version}</span>
                <span className="text-xs">Действует с: {formatDateRu(document.effectiveDate)}</span>
            </div>
        </div>
    );
}
