export interface FetchWithRetryOptions {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const { timeoutMs = 8000, retries = 2, backoffMs = 500 } = options;

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HazeWatch-SEA/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upstream HTTP error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isLastAttempt = attempt === retries;
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (isLastAttempt) {
        throw new Error(`Failed to fetch from ${url} after ${retries + 1} attempts: ${errorMessage}`);
      }

      // Exponential backoff with jitter
      const delay = backoffMs * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error(`Failed to complete request to ${url}`);
}
