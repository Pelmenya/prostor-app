import { describe, it, expect } from 'vitest';
import { validateFileSizes } from './validate-file-size';
import { FILE_SIZE_LIMITS } from './file-limits';

function makeFile(name: string, size: number, type = 'application/pdf'): File {
    const file = new File(['x'.repeat(size)], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

describe('validateFileSizes', () => {
    it('пустой список → нет валидных и нет ошибок', () => {
        expect(validateFileSizes([])).toEqual({ validFiles: [], errors: [] });
    });

    it('файл в пределах лимита → проходит', () => {
        const file = makeFile('doc.pdf', FILE_SIZE_LIMITS.FILE - 1);
        const { validFiles, errors } = validateFileSizes([file]);
        expect(validFiles).toHaveLength(1);
        expect(errors).toHaveLength(0);
    });

    it('файл сверх лимита → ошибка', () => {
        const file = makeFile('big.pdf', FILE_SIZE_LIMITS.FILE + 1);
        const { validFiles, errors } = validateFileSizes([file]);
        expect(validFiles).toHaveLength(0);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('big.pdf');
    });

    it('изображение сверх лимита → ошибка с текстом «изображения»', () => {
        const img = makeFile('photo.jpg', FILE_SIZE_LIMITS.IMAGE + 1, 'image/jpeg');
        const { errors } = validateFileSizes([img]);
        expect(errors[0]).toContain('изображения');
    });

    it('изображение в пределах лимита → проходит', () => {
        const img = makeFile('thumb.png', FILE_SIZE_LIMITS.IMAGE - 1, 'image/png');
        const { validFiles } = validateFileSizes([img]);
        expect(validFiles).toHaveLength(1);
    });

    it('смешанный список — валидные и невалидные раздельно', () => {
        const ok = makeFile('ok.pdf', 100);
        const bad = makeFile('bad.pdf', FILE_SIZE_LIMITS.FILE + 1);
        const { validFiles, errors } = validateFileSizes([ok, bad]);
        expect(validFiles).toHaveLength(1);
        expect(errors).toHaveLength(1);
    });
});
