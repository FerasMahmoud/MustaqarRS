/**
 * Centralized structured logging system
 *
 * Features:
 * - Structured logs with timestamp, level, message, and context
 * - JSON format in production for easy parsing
 * - Human-readable format in development
 * - Type-safe context objects
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Format a log entry based on environment
 */
function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production - easy to parse by log aggregators
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const { timestamp, level, message, context } = entry;
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const color = levelColors[level];

  let output = `${timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += `\n  ${JSON.stringify(context, null, 2).split('\n').join('\n  ')}`;
  }

  return output;
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 && { context }),
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      // Only output debug logs in development
      if (!isProduction) {
        console.debug(formatted);
      }
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Logger object with methods for each log level
 */
export const logger = {
  /**
   * Debug level - detailed information for debugging
   * Only output in development mode
   */
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },

  /**
   * Info level - general information about application flow
   */
  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },

  /**
   * Warn level - potentially problematic situations
   */
  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },

  /**
   * Error level - error events that might still allow the application to continue
   */
  error(message: string, context?: LogContext): void {
    log('error', message, context);
  },

  /**
   * Log an error with automatic error object parsing
   * Extracts message, name, and stack from Error objects
   */
  errorWithException(message: string, error: unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorMessage = error.message;
      errorContext.errorName = error.name;
      if (!isProduction && error.stack) {
        errorContext.errorStack = error.stack;
      }
    } else if (typeof error === 'string') {
      errorContext.errorMessage = error;
    } else {
      errorContext.errorMessage = String(error);
    }

    log('error', message, errorContext);
  },
};

export default logger;
