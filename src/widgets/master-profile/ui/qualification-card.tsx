import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { CardWrapper } from '@/shared/ui/card-wrapper';
import {
    EServiceGrade,
    getCategoriesByGrade,
    getCategoryLabel,
    getGradeLabel,
} from '@/entities/account-service';

type TQualificationCardProps = {
    grade?: EServiceGrade | null;
    outlined?: boolean;
    readOnly?: boolean;
    linkTo?: string;
};

export function QualificationCard({
    grade,
    outlined = false,
    readOnly = false,
    linkTo = '/master/qualification',
}: TQualificationCardProps) {
    const categories = grade ? getCategoriesByGrade(grade) : [];

    const content = (
        <CardWrapper outlined={outlined}>
            <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                    <h5 className="font-semibold">Квалификация</h5>
                    {!readOnly && <PencilSquareIcon className="size-6 shrink-0" />}
                </div>
                <div className="divider m-0" />
                <div className="flex flex-col gap-2">
                    {categories.length > 0 && (
                        <div>
                            <p className="text-sm mb-2">Категории специализации:</p>
                            <div className="flex gap-2 flex-wrap">
                                {categories.map((category) => (
                                    <span key={category} className="badge badge-primary">
                                        {getCategoryLabel(category)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {grade && (
                        <div>
                            <p className="text-sm mb-2">Грейд/Квалификация:</p>
                            <span className="badge badge-secondary border border-primary">
                                {getGradeLabel(grade)}
                            </span>
                        </div>
                    )}
                    {!grade && <p className="text-sm text-base-content/40">Не указана</p>}
                </div>
            </div>
        </CardWrapper>
    );

    if (readOnly) return content;

    return <Link href={linkTo}>{content}</Link>;
}
