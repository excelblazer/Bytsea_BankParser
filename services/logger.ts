/**
 * Logger Service
 * Centralized logging utility for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
}

const isDevelopment = import.meta.env.DEV;

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any): void {
    this.log('error', message, error);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
    };

    // Add to log history
    this.logs.push(entry);

    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (isDevelopment) {
      const logMethod = console[level] || console.log;
      const timestamp = entry.timestamp.toISOString();

      if (data) {
        logMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
      } else {
        logMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      }
    }

    // In production, errors are always logged to console
    if (level === 'error') {
      console.error(`[${entry.timestamp.toISOString()}] ${message}`, data);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export backward-compatible functions
export function info(...args: any[]) {
  logger.info(args[0], args.slice(1));
}

export function warn(...args: any[]) {
  logger.warn(args[0], args.slice(1));
}

export function error(...args: any[]) {
  logger.error(args[0], args.slice(1));
}

export default { info, warn, error, logger };
