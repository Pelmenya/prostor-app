import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSpinner } from './page-spinner';

describe('PageSpinner', () => {
    it('рендерит спиннер', () => {
        render(<PageSpinner />);
        const spinner = document.querySelector('.loading-spinner');
        expect(spinner).toBeTruthy();
    });

    it('содержит класс text-primary', () => {
        render(<PageSpinner />);
        const spinner = document.querySelector('.loading-spinner');
        expect(spinner?.classList.contains('text-primary')).toBe(true);
    });
});
