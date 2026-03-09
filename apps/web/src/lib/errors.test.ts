import { describe, expect, it, vi } from 'vitest';

vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { AppError, isAppError, logServerError, toErrorResponse } from './errors';
import { logger } from './logger';

describe('errors', () => {
  describe('AppError', () => {
    it('creates an error with code, message, and status', () => {
      const err = new AppError('NOT_FOUND', 'Item not found', 404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Item not found');
      expect(err.status).toBe(404);
      expect(err.name).toBe('AppError');
    });

    it('stores a cause', () => {
      const cause = new Error('original');
      const err = new AppError('WRAP', 'wrapped', 500, { cause });
      expect(err.cause).toBe(cause);
    });
  });

  describe('isAppError', () => {
    it('returns true for AppError instances', () => {
      expect(isAppError(new AppError('X', 'x', 400))).toBe(true);
    });

    it('returns false for plain errors', () => {
      expect(isAppError(new Error('plain'))).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe('logServerError', () => {
    it('skips logging for client-level AppErrors (4xx)', () => {
      logServerError('test', new AppError('BAD', 'bad request', 400));
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs 5xx AppErrors', () => {
      logServerError('ctx', new AppError('ISE', 'server broke', 500));
      expect(logger.error).toHaveBeenCalledWith(
        'ctx',
        'server broke',
        expect.objectContaining({ code: 'ISE', status: 500 }),
      );
    });

    it('logs plain Error instances', () => {
      logServerError('ctx', new Error('boom'));
      expect(logger.error).toHaveBeenCalledWith(
        'ctx',
        'boom',
        expect.objectContaining({ errorName: 'Error' }),
      );
    });

    it('logs unknown error types', () => {
      logServerError('ctx', 42);
      expect(logger.error).toHaveBeenCalledWith(
        'ctx',
        'Unknown error',
        expect.objectContaining({ error: 42 }),
      );
    });

    it('includes metadata in log output', () => {
      logServerError('ctx', new Error('fail'), { taskId: 't1' });
      expect(logger.error).toHaveBeenCalledWith(
        'ctx',
        'fail',
        expect.objectContaining({ taskId: 't1' }),
      );
    });
  });

  describe('toErrorResponse', () => {
    it('returns AppError details for known errors', () => {
      const err = new AppError('VALIDATION_ERROR', 'name required', 400);
      const res = toErrorResponse('test', err, {
        code: 'FALLBACK',
        message: 'fallback',
        status: 500,
      });
      expect(res.status).toBe(400);
    });

    it('uses fallback for unknown errors', () => {
      const res = toErrorResponse('test', new Error('unknown'), {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        status: 500,
      });
      expect(res.status).toBe(500);
    });
  });
});
