type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function emit(entry: LogEntry): void {
  const { level, ...rest } = entry;
  const json = JSON.stringify(rest);

  switch (level) {
    case 'error':
      console.error(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    case 'debug':
      console.debug(json);
      break;
    default:
      console.log(json);
  }
}

function createEntry(
  level: LogLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  debug(context: string, message: string, meta?: Record<string, unknown>): void {
    emit(createEntry('debug', context, message, meta));
  },

  info(context: string, message: string, meta?: Record<string, unknown>): void {
    emit(createEntry('info', context, message, meta));
  },

  warn(context: string, message: string, meta?: Record<string, unknown>): void {
    emit(createEntry('warn', context, message, meta));
  },

  error(context: string, message: string, meta?: Record<string, unknown>): void {
    emit(createEntry('error', context, message, meta));
  },
};
