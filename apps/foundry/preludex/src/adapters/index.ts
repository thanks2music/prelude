export type { SiteAdapter, CrawlOptions, FetchResult } from './types.js'
export { mdxAdapter } from './mdx.js'
export { playwrightAdapter, closeBrowser } from './playwright.js'
export { jinaAdapter } from './jina.js'

import type { SiteAdapter, CrawlOptions } from './types.js'
import { mdxAdapter } from './mdx.js'
import { playwrightAdapter } from './playwright.js'
import { jinaAdapter } from './jina.js'

/**
 * Fetch markdown content with fallback strategy
 *
 * Default mode (local-only):
 * 1. Site-specific adapter (MDX for Claude/Vercel)
 * 2. Playwright + turndown
 *
 * --use-jina mode:
 * 1. Site-specific adapter
 * 2. Jina Reader API
 * 3. Playwright (fallback)
 */
export async function fetchWithFallback(
  url: URL,
  options: CrawlOptions
): Promise<{ content: string; adapter: string }> {
  const errors: Array<{ adapter: string; error: Error }> = []

  // 1. Try site-specific adapter (MDX)
  if (mdxAdapter.match(url)) {
    try {
      if (options.verbose) {
        console.log(`Trying adapter: ${mdxAdapter.name}`)
      }
      const content = await mdxAdapter.fetchMarkdown(url)
      return { content, adapter: mdxAdapter.name }
    } catch (error) {
      errors.push({ adapter: mdxAdapter.name, error: error as Error })
      if (options.verbose) {
        console.warn(`${mdxAdapter.name} failed:`, (error as Error).message)
      }
    }
  }

  // 2. Try Jina Reader if enabled (opt-in)
  if (options.useJina) {
    try {
      if (options.verbose) {
        console.log(`Trying adapter: ${jinaAdapter.name} (external API)`)
      }
      const content = await jinaAdapter.fetchMarkdown(url)
      return { content, adapter: jinaAdapter.name }
    } catch (error) {
      errors.push({ adapter: jinaAdapter.name, error: error as Error })
      if (options.verbose) {
        console.warn(`${jinaAdapter.name} failed:`, (error as Error).message)
      }
      console.log('Falling back to Playwright...')
    }
  }

  // 3. Playwright adapter (default/fallback)
  try {
    if (options.verbose) {
      console.log(`Trying adapter: ${playwrightAdapter.name}`)
    }
    const content = await playwrightAdapter.fetchMarkdown(url)
    return { content, adapter: playwrightAdapter.name }
  } catch (error) {
    errors.push({ adapter: playwrightAdapter.name, error: error as Error })
  }

  // All adapters failed
  const errorMessages = errors
    .map((e) => `${e.adapter}: ${e.error.message}`)
    .join('\n')
  throw new Error(`All adapters failed for ${url}:\n${errorMessages}`)
}

/**
 * Get the appropriate adapter for a URL based on options
 */
export function getAdapter(url: URL, options: CrawlOptions): SiteAdapter {
  // MDX sites always use MDX adapter
  if (mdxAdapter.match(url)) {
    return mdxAdapter
  }

  // Jina if explicitly enabled
  if (options.useJina) {
    return jinaAdapter
  }

  // Default to Playwright
  return playwrightAdapter
}
