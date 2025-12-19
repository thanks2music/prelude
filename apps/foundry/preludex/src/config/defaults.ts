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
} as const

export type Defaults = typeof defaults
