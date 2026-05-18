/**
 * MatchScoreRing — круглый progress ring с большим matchScore % внутри.
 *
 * Заменяет tiny corner badge `{matchScore}%` в product cards. Дизайн от
 * claude.ai uplift 2026-05-18 (`design-art1-mobile-results.png`):
 * 48×48 SVG, track + arc, large `NN%` тext внутри, OKLCH brand colors.
 *
 * Score scale (rank-based Phase 1, slovo backend):
 *   ≥80 → primary blue (high-relevance match)
 *   60..79 → primary blue lighter
 *   <60 → warning orange (low-relevance, юзеру стоит присмотреться)
 *
 * Circle math: r=22, circumference = 2π·22 ≈ 138.23. dashoffset = circ × (1 - p),
 * transform rotate(-90) чтобы start с 12 часов.
 */

type TProps = {
    score: number;
    size?: number;
};

const CIRCUMFERENCE = 2 * Math.PI * 22;

function colorFor(score: number): { stroke: string; text: string } {
    if (score >= 80) {
        // Brand primary blue (middle stop WaterDropAI gradient)
        return { stroke: 'oklch(58% 0.22 250)', text: 'text-primary' };
    }
    if (score >= 60) {
        // Lighter primary (top stop WaterDropAI gradient)
        return { stroke: 'oklch(72% 0.16 232)', text: 'text-primary/85' };
    }
    // Warning — low-relevance, attention orange (daisyui warning token)
    return { stroke: 'oklch(75% 0.18 60)', text: 'text-warning' };
}

export function MatchScoreRing({ score, size = 48 }: TProps) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    const { stroke, text } = colorFor(clamped);
    const dashoffset = CIRCUMFERENCE * (1 - clamped / 100);

    return (
        <div
            className="relative inline-flex items-center justify-center shrink-0"
            style={{ width: size, height: size }}
            aria-label={`Совпадение ${clamped}%`}
            title={`Совпадение ${clamped}%`}
        >
            <svg width={size} height={size} viewBox="0 0 48 48">
                {/* Track — нейтральная тонкая base-200-like окружность */}
                <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="oklch(92% 0.012 240)"
                    strokeWidth="4"
                />
                {/* Progress arc — brand stroke с round linecap */}
                <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke={stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashoffset}
                    transform="rotate(-90 24 24)"
                />
            </svg>
            <span
                className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums ${text}`}
            >
                {clamped}%
            </span>
        </div>
    );
}
