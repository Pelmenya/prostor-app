import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchScoreRing } from './match-score-ring';

/**
 * Tests для MatchScoreRing — pure component с math (CIRCUMFERENCE / dashoffset)
 * + color branching (>=80 / 60-79 / <60). Snapshot не нужен, проверяем:
 *  - aria-label / title rendering
 *  - score clamping [0..100]
 *  - colorClassFor branches через text-* className на parent
 *  - dashoffset math: circ × (1 - p)
 */

const CIRCUMFERENCE = 2 * Math.PI * 22; // ≈ 138.23

describe('MatchScoreRing', () => {
    it('renders score % внутри + aria-label с прописью', () => {
        render(<MatchScoreRing score={85} />);
        expect(screen.getByText('85%')).toBeDefined();
        expect(screen.getByLabelText('Совпадение 85 процентов')).toBeDefined();
    });

    it('clamps score>100 на 100', () => {
        render(<MatchScoreRing score={150} />);
        expect(screen.getByText('100%')).toBeDefined();
    });

    it('clamps score<0 на 0', () => {
        render(<MatchScoreRing score={-25} />);
        expect(screen.getByText('0%')).toBeDefined();
    });

    it('rounds float scores', () => {
        render(<MatchScoreRing score={78.6} />);
        expect(screen.getByText('79%')).toBeDefined();
    });

    describe('color branches via className', () => {
        it('score >= 80 → text-primary', () => {
            const { container } = render(<MatchScoreRing score={95} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-primary');
            expect(root.className).not.toContain('text-primary/85');
            expect(root.className).not.toContain('text-warning');
        });

        it('score 60..79 → text-primary/85', () => {
            const { container } = render(<MatchScoreRing score={65} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-primary/85');
            expect(root.className).not.toContain('text-warning');
        });

        it('score < 60 → text-warning', () => {
            const { container } = render(<MatchScoreRing score={45} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-warning');
            expect(root.className).not.toContain('text-primary/85');
        });

        it('boundary score=80 → text-primary (not lighter)', () => {
            const { container } = render(<MatchScoreRing score={80} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-primary');
            expect(root.className).not.toContain('text-primary/85');
        });

        it('boundary score=60 → text-primary/85 (not warning)', () => {
            const { container } = render(<MatchScoreRing score={60} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-primary/85');
        });

        it('boundary score=59 → text-warning', () => {
            const { container } = render(<MatchScoreRing score={59} />);
            const root = container.firstChild as HTMLElement;
            expect(root.className).toContain('text-warning');
        });
    });

    describe('dashoffset math', () => {
        it('score=100 → dashoffset=0 (полный круг)', () => {
            const { container } = render(<MatchScoreRing score={100} />);
            const progressCircle = container.querySelectorAll('circle')[1] as SVGCircleElement;
            expect(Number(progressCircle.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 2);
        });

        it('score=0 → dashoffset=CIRCUMFERENCE (пустой круг)', () => {
            const { container } = render(<MatchScoreRing score={0} />);
            const progressCircle = container.querySelectorAll('circle')[1] as SVGCircleElement;
            expect(Number(progressCircle.getAttribute('stroke-dashoffset'))).toBeCloseTo(
                CIRCUMFERENCE,
                2,
            );
        });

        it('score=50 → dashoffset=CIRCUMFERENCE/2 (полукруг)', () => {
            const { container } = render(<MatchScoreRing score={50} />);
            const progressCircle = container.querySelectorAll('circle')[1] as SVGCircleElement;
            expect(Number(progressCircle.getAttribute('stroke-dashoffset'))).toBeCloseTo(
                CIRCUMFERENCE / 2,
                2,
            );
        });
    });

    describe('size prop', () => {
        it('default size=48', () => {
            const { container } = render(<MatchScoreRing score={50} />);
            const root = container.firstChild as HTMLElement;
            expect(root.style.width).toBe('48px');
            expect(root.style.height).toBe('48px');
        });

        it('custom size=64', () => {
            const { container } = render(<MatchScoreRing score={50} size={64} />);
            const root = container.firstChild as HTMLElement;
            expect(root.style.width).toBe('64px');
            expect(root.style.height).toBe('64px');
        });
    });
});
