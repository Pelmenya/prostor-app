export const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
export const expBackoff = (attempt: number) => Math.min(400 * Math.pow(2, attempt), 3000);
export const MAX_RETRY_ATTEMPTS = 3;

export async function retryAsync<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === MAX_RETRY_ATTEMPTS - 1) throw err;
            await sleep(expBackoff(attempt));
        }
    }
    throw new Error('unreachable');
}
