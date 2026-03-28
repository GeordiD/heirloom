export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function createError(options: {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
}): HttpError {
  return new HttpError(
    options.statusCode ?? 500,
    options.statusMessage ?? options.message ?? "Internal server error",
  );
}

/**
 * Convert a caught error to a Response, for use in route handlers.
 * Preserves the status code from HttpError instances.
 */
export function errorToResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return new Response(err.message, { status: err.statusCode });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  return new Response(message, { status: 500 });
}
