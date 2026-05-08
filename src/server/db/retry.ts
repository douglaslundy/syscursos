type RetryOptions = {
  attempts?: number;
  delayMs?: number;
};

const defaultOptions: Required<RetryOptions> = {
  attempts: 2,
  delayMs: 120,
};

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { attempts, delayMs } = {
    ...defaultOptions,
    ...options,
  };

  let lastError: unknown;

  for (let currentAttempt = 1; currentAttempt <= attempts; currentAttempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const canRetry = currentAttempt < attempts && isTransientDbError(error);
      if (!canRetry) {
        throw error;
      }

      await delay(delayMs);
    }
  }

  throw lastError;
}

function isTransientDbError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("max clients reached") ||
    message.includes("too many clients") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
