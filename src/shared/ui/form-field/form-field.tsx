type TProps = {
    label: string;
    error?: string;
    children: React.ReactNode;
};

export function FormField({ label, error, children }: TProps) {
    return (
        <div className="form-control">
            <label className="floating-label">
                <span>{label}</span>
                {children}
            </label>
            {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
    );
}
