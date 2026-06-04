import { FILE_SIZE_LIMITS } from './file-limits';

export type TFileValidationResult = {
    validFiles: File[];
    errors: string[];
};

export function validateFileSizes(files: File[]): TFileValidationResult {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
        const isImage = file.type.startsWith('image/');
        const limit = isImage ? FILE_SIZE_LIMITS.IMAGE : FILE_SIZE_LIMITS.FILE;
        const limitMB = limit / (1024 * 1024);
        const limitText =
            limitMB >= 1 ? `${Math.floor(limitMB)} МБ` : `${Math.floor(limit / 1024)} КБ`;

        if (file.size > limit) {
            errors.push(
                `"${file.name}": размер ${isImage ? 'изображения' : 'файла'} превышает ${limitText}`,
            );
        } else {
            validFiles.push(file);
        }
    });

    return { validFiles, errors };
}
