type TFormCardProps = {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitText: string;
    isLoading?: boolean;
};

export function FormCard({ children, onSubmit, submitText, isLoading = false }: TFormCardProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="p-4 flex flex-col gap-4 border rounded-2xl border-base-content/10"
        >
            {children}
            <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : submitText}
            </button>
        </form>
    );
}
