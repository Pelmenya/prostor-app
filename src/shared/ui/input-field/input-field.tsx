type TInputFieldProps = {
    label: string;
    error?: string;
    children: React.ReactNode;
};

export function InputField({ label, error, children }: TInputFieldProps) {
    return (
        <label className="flex flex-col gap-1">
            <span>{label}:</span>
            {children}
            {error && <span className="text-error text-xs">{error}</span>}
        </label>
    );
}
