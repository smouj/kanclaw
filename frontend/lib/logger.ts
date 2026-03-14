// Simple logging utility for KanClaw
// In production, replace with Sentry, Logtail, or similar

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDev = process.env.NODE_ENV !== 'production';
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? { message: error.message, stack: error.stack || '' } : undefined,
    };

    // Keep in memory for debugging
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const prefix = `[${level.toUpperCase()}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    switch (level) {
      case 'debug':
        this.isDev && console.debug(prefix, message, contextStr);
        break;
      case 'info':
        console.info(prefix, message, contextStr);
        break;
      case 'warn':
        console.warn(prefix, message, contextStr);
        break;
      case 'error':
        console.error(prefix, message, contextStr, error ? `\n${error.stack}` : '');
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  // Get recent logs (for debugging)
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((l) => l.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  clear() {
    this.logs = [];
  }

  // Export logs for error reporting
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
};

// Error boundary logging hook
export function useErrorLogger() {
  return (error: Error, context?: Record<string, unknown>) => {
    logger.error('React Error Boundary caught error', error, {
      ...context,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
  };
}
