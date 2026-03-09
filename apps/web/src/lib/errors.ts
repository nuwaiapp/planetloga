import { NextResponse } from 'next/server';
import { logger } from './logger';

interface AppErrorOptions {
  cause?: unknown;
}

interface ErrorResponseFallback {
  code: string;
  message: string;
  status: number;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  override readonly cause?: unknown;

  constructor(code: string, message: string, status: number, options?: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.cause = options?.cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function logServerError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): void {
  if (isAppError(error) && error.status < 500) {
    return;
  }

  if (error instanceof Error) {
    logger.error(context, error.message, {
      errorName: error.name,
      stack: error.stack,
      ...(isAppError(error) ? { code: error.code, status: error.status } : {}),
      ...metadata,
    });
    return;
  }

  logger.error(context, 'Unknown error', { error, ...metadata });
}

export function toErrorResponse(
  context: string,
  error: unknown,
  fallback: ErrorResponseFallback,
  metadata?: Record<string, unknown>,
) {
  const responseError = isAppError(error)
    ? error
    : new AppError(fallback.code, fallback.message, fallback.status, { cause: error });

  logServerError(context, error, metadata);

  return NextResponse.json(
    {
      error: {
        code: responseError.code,
        message: responseError.message,
      },
    },
    { status: responseError.status },
  );
}
