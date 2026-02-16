/**
 * Sitemap parser for URL discovery
 */

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

/**
 * Fetch and parse sitemap.xml
 * Supports both regular sitemaps and sitemap index files
 */
export async function parseSitemap(sitemapUrl: string): Promise<URL[]> {
  const response = await fetch(sitemapUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`)
  }

  const xml = await response.text()
  const urls: URL[] = []

  // Check if this is a sitemap index
  if (xml.includes('<sitemapindex')) {
    const sitemapUrls = extractSitemapIndexUrls(xml)
    console.log(`Found sitemap index with ${sitemapUrls.length} sitemaps`)

    // Fetch each sitemap in the index
    for (const url of sitemapUrls) {
      try {
        const childUrls = await parseSitemap(url)
        urls.push(...childUrls)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.warn(`Failed to parse child sitemap ${url}: ${msg}`)
      }
    }
  } else {
    // Regular sitemap
    const sitemapUrls = extractSitemapUrls(xml)
    urls.push(...sitemapUrls)
  }

  return urls
}

/**
 * Extract sitemap URLs from a sitemap index
 */
function extractSitemapIndexUrls(xml: string): string[] {
  const urls: string[] = []
  const locRegex = /<sitemap>\s*<loc>([^<]+)<\/loc>/g

  for (const match of xml.matchAll(locRegex)) {
    const url = match[1].trim()
    if (url) {
      urls.push(url)
    }
  }

  return urls
}

/**
 * Extract page URLs from a sitemap
 */
function extractSitemapUrls(xml: string): URL[] {
  const urls: URL[] = []
  const locRegex = /<url>\s*<loc>([^<]+)<\/loc>/g

  for (const match of xml.matchAll(locRegex)) {
    try {
      const url = new URL(match[1].trim())
      urls.push(url)
    } catch {
      // Invalid URL, skip
    }
  }

  return urls
}

/**
 * Filter URLs to match a base path pattern
 */
export function filterByBasePath(urls: URL[], basePath: string): URL[] {
  return urls.filter((url) => url.pathname.startsWith(basePath))
}

/**
 * Try to find sitemap URL for a given site
 * Common locations: /sitemap.xml, /sitemap_index.xml
 */
export async function findSitemapUrl(baseUrl: URL): Promise<string | null> {
  const candidates = [
    new URL('/sitemap.xml', baseUrl).toString(),
    new URL('/sitemap_index.xml', baseUrl).toString(),
    new URL('/sitemap-index.xml', baseUrl).toString(),
  ]

  for (const url of candidates) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        return url
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null
}
