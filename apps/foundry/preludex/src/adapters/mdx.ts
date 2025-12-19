import type { SiteAdapter } from './types.js'
import { toMdUrl } from '../url.js'
import { defaults } from '../config/defaults.js'

/**
 * Fetch text content with proper headers
 */
async function fetchText(url: URL): Promise<string> {
  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': defaults.userAgent,
      Accept: 'text/markdown,text/plain,text/html,*/*',
    },
  })

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${url}`)
  }

  const text = await res.text()

  // Check if HTML was returned instead of markdown
  if (text.trim().toLowerCase().startsWith('<!doctype')) {
    throw new Error('HTML returned, not markdown')
  }

  return text
}

/**
 * Sites that support direct MDX/MD fetch
 */
const MDX_SITES = [
  'platform.claude.com',
  'docs.anthropic.com', // redirects to platform.claude.com
  'vercel.com',
  'nextjs.org',
]

/**
 * MDX Adapter
 * For sites that serve markdown/MDX directly (Claude Docs, Vercel, etc.)
 */
export const mdxAdapter: SiteAdapter = {
  name: 'mdx',

  match: (url: URL): boolean => {
    return MDX_SITES.some(
      (site) => url.hostname === site || url.hostname.endsWith(`.${site}`)
    )
  },

  fetchMarkdown: async (url: URL): Promise<string> => {
    const mdUrl = toMdUrl(url)
    return fetchText(mdUrl)
  },
}
