'use client';

import { useCurrentPolicy } from '@/entities/privacy-policy';
import { LegalDocumentModal } from '@/shared/ui';

type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
};

export function PrivacyPolicyModal({ isOpen, onClose, onAgree }: TProps) {
    const { data, isLoading, isError } = useCurrentPolicy();

    return (
        <LegalDocumentModal
            isOpen={isOpen}
            onClose={onClose}
            onAgree={onAgree}
            title="Политика конфиденциальности"
            agreeLabel="Согласен"
            errorMessage="Не удалось загрузить политику конфиденциальности"
            document={data}
            isLoading={isLoading}
            isError={isError}
        />
    );
}
