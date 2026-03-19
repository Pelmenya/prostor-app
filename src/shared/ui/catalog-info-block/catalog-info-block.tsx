import { InformationCircleIcon } from '@heroicons/react/24/outline';

type TCatalogInfoBlockProps = {
    children: React.ReactNode;
};

export function CatalogInfoBlock({ children }: TCatalogInfoBlockProps) {
    return (
        <div role="alert" className="alert alert-horizontal rounded-2xl max-w-136">
            <InformationCircleIcon className="stroke-info size-6" />
            <p className="text-sm font-medium leading-none">{children}</p>
        </div>
    );
}
