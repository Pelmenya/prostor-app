import { CardWrapper } from '@/shared/ui/card-wrapper';
import {
    EServiceGrade,
    getCategoriesByGrade,
    getCategoryLabel,
    getGradeLabel,
} from '@/entities/account-service';

type TQualificationDisplayCardProps = {
    grade?: EServiceGrade | null;
};

export function QualificationDisplayCard({ grade }: TQualificationDisplayCardProps) {
    const categories = grade ? getCategoriesByGrade(grade) : [];

    return (
        <CardWrapper outlined>
            <div className="flex flex-col w-full">
                <h5 className="font-semibold">Квалификация</h5>
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
}
