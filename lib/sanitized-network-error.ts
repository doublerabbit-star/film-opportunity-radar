type ErrorRecord = Record<string, unknown>;

export type SanitizedNetworkError = {
  errorName: string;
  causeCode: string | number | null;
  causeMessage: string | null;
  errno: string | number | null;
  syscall: string | null;
  address: string | null;
  port: string | number | null;
};

function asRecord(value: unknown): ErrorRecord | null {
  return typeof value === "object" && value !== null
    ? value as ErrorRecord
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function stringOrNumberValue(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function sanitizeNetworkError(error: unknown): SanitizedNetworkError {
  const record = asRecord(error);
  const cause = asRecord(record?.cause);

  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
    causeCode: stringOrNumberValue(cause?.code),
    causeMessage: error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : stringValue(cause?.message),
    errno: stringOrNumberValue(cause?.errno),
    syscall: stringValue(cause?.syscall),
    address: stringValue(cause?.address),
    port: stringOrNumberValue(cause?.port),
  };
}

export function logSanitizedNetworkError(
  upstream: "gemini" | "rss",
  targetHost: string,
  error: unknown,
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.error(
    `[upstream:${upstream}] connection-error`,
    JSON.stringify({ targetHost, ...sanitizeNetworkError(error) }),
  );
}

