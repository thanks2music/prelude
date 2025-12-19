import { docPatterns } from './config/patterns.js'

/**
 * Normalize a URL by removing hash and search params
 */
export function normalizePageUrl(input: string): URL {
  const url = new URL(input)
  url.hash = ''
  url.search = ''
  return url
}

/**
 * Convert page URL to MDX/MD URL (for MDX adapter)
 */
export function toMdUrl(pageUrl: URL): URL {
  if (pageUrl.pathname.endsWith('.md') || pageUrl.pathname.endsWith('.mdx')) {
    return pageUrl
  }
  const md = new URL(pageUrl.toString())
  md.pathname = md.pathname.replace(/\/$/, '') + '.md'
  return md
}

/**
 * Detect the base path for documentation from URL
 * e.g., https://example.com/docs/getting-started -> /docs/
 */
export function detectBasePath(url: URL): string | undefined {
  const pathParts = url.pathname.split('/').filter(Boolean)

  for (const part of pathParts) {
    if (docPatterns.includes(part.toLowerCase() as (typeof docPatterns)[number])) {
      return `/${part}/`
    }
  }

  return undefined
}

/**
 * Convert URL to local file path
 *
 * Examples:
 *   https://example.com/docs/api/overview -> api/overview.md
 *   https://example.com/docs/getting-started -> getting-started.md
 *   https://example.com/docs/ -> index.md
 */
export function toLocalPath(pageUrl: URL): string {
  const parts = pageUrl.pathname.split('/').filter(Boolean)

  // Find documentation root (docs, documentation, api, guide, etc.)
  let startIndex = 0

  for (let i = 0; i < parts.length; i++) {
    if (docPatterns.includes(parts[i].toLowerCase() as (typeof docPatterns)[number])) {
      startIndex = i + 1
      break
    }
  }

  // Get path after docs root
  const pathParts = parts.slice(startIndex)

  // Handle empty path (root docs page)
  if (pathParts.length === 0) {
    return 'index.md'
  }

  // Get file name (last part)
  const file = pathParts.pop() || 'index'

  // Build path
  const dir = pathParts.join('/')
  const fileName = `${file}.md`

  return dir ? `${dir}/${fileName}` : fileName
}
