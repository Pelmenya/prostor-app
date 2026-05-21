/**
 * MatchScoreRing — круглый progress ring с большим matchScore % внутри.
 *
 * Заменяет tiny corner badge `{matchScore}%` в product cards. Дизайн от
 * claude.ai uplift 2026-05-18 (`design-art1-mobile-results.png`):
 * 48×48 SVG, track + arc, large `NN%` тext внутри, brand colors через
 * Tailwind classes (currentColor stroke). Раньше использовался inline
 * `stroke="oklch(...)"` — это ломается на iOS Safari < 16.4 (SVG attr
 * парсер для oklch() поздняя поддержка). Теперь — CSS variable через
 * className → daisyUI токены resolve'ятся.
 *
 * Score scale (rank-based Phase 1, slovo backend):
 *   ≥80 → text-primary (high-relevance match)
 *   60..79 → text-primary с opacity (lighter)
 *   <60 → text-warning (low-relevance, юзеру стоит присмотреться)
 *
 * Circle math: r=22, circumference = 2π·22 ≈ 138.23. dashoffset = circ × (1 - p),
 * transform rotate(-90) чтобы start с 12 часов.
 */

type TProps = {
    score: number;
    size?: number;
};

const CIRCUMFERENCE = 2 * Math.PI * 22;

/**
 * Возвращает Tailwind className для text + stroke (через `text-{token}`
 * + `stroke="currentColor"` в SVG circle). Цвета берутся из daisyUI токенов
 * — авто-resolve в OKLCH через CSS variables, без inline oklch().
 */
function colorClassFor(score: number): string {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-primary/85';
    return 'text-warning';
}

export function MatchScoreRing({ score, size = 48 }: TProps) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    const colorClass = colorClassFor(clamped);
    const dashoffset = CIRCUMFERENCE * (1 - clamped / 100);

    return (
        <div
            className={`relative inline-flex items-center justify-center shrink-0 ${colorClass}`}
            style={{ width: size, height: size }}
            aria-label={`Совпадение ${clamped} процентов`}
            title={`Совпадение ${clamped}%`}
        >
            <svg width={size} height={size} viewBox="0 0 48 48">
                {/* Track — нейтральная тонкая base-content/15 окружность.
                    stroke через `text-*` parent + currentColor не работает
                    для track (нужен fixed нейтральный цвет), поэтому
                    inline-className на circle. */}
                <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    className="stroke-base-content/15"
                    strokeWidth="4"
                />
                {/* Progress arc — stroke=currentColor наследует от parent
                    text-{primary|warning|primary/85}. На iOS Safari < 16.4
                    OKLCH работает через CSS var resolve (currentColor → text-
                    color → daisyUI CSS var), не через прямой inline oklch(). */}
                <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashoffset}
                    transform="rotate(-90 24 24)"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums">
                {clamped}%
            </span>
        </div>
    );
}
