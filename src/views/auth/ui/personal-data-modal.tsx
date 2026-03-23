'use client';

import { useCurrentAgreement } from '@/entities/personal-data-agreement';
import { LegalDocumentModal } from '@/shared/ui';

type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
};

export function PersonalDataModal({ isOpen, onClose, onAgree }: TProps) {
    const { data, isLoading, isError } = useCurrentAgreement();

    return (
        <LegalDocumentModal
            isOpen={isOpen}
            onClose={onClose}
            onAgree={onAgree}
            title="Согласие на обработку персональных данных"
            agreeLabel="Согласен"
            errorMessage="Не удалось загрузить согласие на обработку ПДн"
            document={data}
            isLoading={isLoading}
            isError={isError}
        />
    );
}
