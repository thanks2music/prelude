/**
 * Site adapter interface for fetching documentation pages
 */
export interface SiteAdapter {
  /** Adapter name for logging */
  name: string

  /** Check if this adapter can handle the given URL */
  match: (url: URL) => boolean

  /** Fetch the page and return markdown content */
  fetchMarkdown: (url: URL) => Promise<string>
}

/**
 * CLI options passed to adapters
 */
export interface CrawlOptions {
  /** Output directory */
  outDir: string

  /** Use Jina Reader API (opt-in) */
  useJina?: boolean

  /** Use sitemap.xml for URL discovery */
  useSitemap?: boolean

  /** Maximum crawl depth */
  depth?: number

  /** Concurrency limit */
  concurrency?: number

  /** Verbose logging */
  verbose?: boolean
}

/**
 * Result of a fetch operation
 */
export interface FetchResult {
  /** The markdown content */
  content: string

  /** URLs found in the content */
  links: URL[]

  /** The adapter that was used */
  adapter: string
}
