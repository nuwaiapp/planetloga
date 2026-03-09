export class SdkError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SdkError';
    this.code = code;
  }
}

export function mapAnchorError(error: unknown): SdkError {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('already in use')) {
      return new SdkError('ALREADY_EXISTS', 'Account already exists', { cause: error });
    }
    if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
      return new SdkError('INSUFFICIENT_FUNDS', 'Insufficient SOL or AIM balance', { cause: error });
    }
    if (msg.includes('Unauthorized') || msg.includes('has_one')) {
      return new SdkError('UNAUTHORIZED', 'Transaction signer is not authorized', { cause: error });
    }
    return new SdkError('TRANSACTION_FAILED', msg, { cause: error });
  }
  return new SdkError('UNKNOWN_ERROR', String(error));
}
