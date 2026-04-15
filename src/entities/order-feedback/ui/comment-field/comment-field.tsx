type TCommentFieldProps = {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
};

export function CommentField({ value, onChange, disabled }: TCommentFieldProps) {
    return (
        <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Комментарий (необязательно)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
        />
    );
}
