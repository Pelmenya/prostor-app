export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';

/**
 * URL slovo-api (water-analysis: heatmap / predict / equipment-suggest /
 * depth-map / depth-predict / aquifer-stats / points). Отдельный сервис от
 * основного бэка PROSTOR (NestJS + 1101 unit-test зелёные на 8 мая 2026).
 */
export const SLOVO_API_URL = process.env.NEXT_PUBLIC_SLOVO_API_URL || 'http://localhost:3101';
