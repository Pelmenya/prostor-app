type TSectionLabelProps = {
    children: React.ReactNode;
    className?: string;
};

export function SectionLabel({ children, className = '' }: TSectionLabelProps) {
    return (
        <h2
            className={`text-xs text-base-content/50 font-medium uppercase tracking-wide ${className}`}
        >
            {children}
        </h2>
    );
}
