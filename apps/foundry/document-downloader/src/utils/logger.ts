/**
 * Configurable logging utility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Logger with configurable log levels
 */
export class Logger {
  constructor(private minLevel: LogLevel = 'info') {}

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.minLevel
  }

  /**
   * Log debug message (detailed diagnostic information)
   */
  debug(message: string, ...args: any[]): void {
    if (LEVELS[this.minLevel] <= LEVELS.debug) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Log info message (general informational messages)
   */
  info(message: string, ...args: any[]): void {
    if (LEVELS[this.minLevel] <= LEVELS.info) {
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  /**
   * Log warning message (warnings that don't stop execution)
   */
  warn(message: string, ...args: any[]): void {
    if (LEVELS[this.minLevel] <= LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  /**
   * Log error message (errors that may stop execution)
   */
  error(message: string, ...args: any[]): void {
    if (LEVELS[this.minLevel] <= LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }

  /**
   * Log without level prefix (for progress, summary, etc.)
   */
  log(message: string, ...args: any[]): void {
    console.log(message, ...args)
  }
}

/**
 * Default logger instance
 * Log level can be set via PRELUDEX_LOG_LEVEL environment variable
 */
const getDefaultLogLevel = (): LogLevel => {
  const envLevel = process.env.PRELUDEX_LOG_LEVEL?.toLowerCase()
  if (
    envLevel === 'debug' ||
    envLevel === 'info' ||
    envLevel === 'warn' ||
    envLevel === 'error'
  ) {
    return envLevel
  }
  return 'info'
}

export const logger = new Logger(getDefaultLogLevel())
