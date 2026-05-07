type TFormCardProps = {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitText: string;
    isLoading?: boolean;
    hideSubmit?: boolean;
};

export function FormCard({
    children,
    onSubmit,
    submitText,
    isLoading = false,
    hideSubmit = false,
}: TFormCardProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="p-4 flex flex-col gap-4 border rounded-2xl border-base-content/10 max-w-md mx-auto w-full"
        >
            {children}
            {!hideSubmit && (
                <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                    {isLoading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        submitText
                    )}
                </button>
            )}
        </form>
    );
}
