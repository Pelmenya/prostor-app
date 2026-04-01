export const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
export const expBackoff = (attempt: number) => Math.min(400 * Math.pow(2, attempt), 3000);
export const MAX_RETRY_ATTEMPTS = 3;
