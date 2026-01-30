/**
 * Default configuration values for preludex
 */
export const defaults = {
  /** Default output directory */
  outDir: 'docs',

  /** Maximum crawl depth */
  depth: 1,

  /** Number of concurrent requests */
  concurrency: 3,

  /** Request timeout in milliseconds */
  timeout: 30000,

  /** User-Agent header for HTTP requests */
  userAgent: 'Mozilla/5.0 preludex/1.0 (Documentation Crawler)',

  /** Maximum file size in bytes (10MB default) */
  maxFileSizeBytes: 10 * 1024 * 1024,
} as const

export type Defaults = typeof defaults
