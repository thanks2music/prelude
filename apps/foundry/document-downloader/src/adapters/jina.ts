import type { SiteAdapter } from './types.js'

/**
 * Jina Reader API base URL
 */
const JINA_API_URL = 'https://r.jina.ai'

/**
 * Jina Reader Adapter
 * Uses Jina Reader API for HTML to Markdown conversion
 *
 * NOTE: This adapter sends URLs to an external API.
 * Only use with --use-jina flag (opt-in).
 */
export const jinaAdapter: SiteAdapter = {
  name: 'jina',

  match: (): boolean => {
    // Matches all URLs when explicitly enabled
    return true
  },

  fetchMarkdown: async (url: URL): Promise<string> => {
    const apiUrl = `${JINA_API_URL}/${url.toString()}`

    const headers: Record<string, string> = {
      Accept: 'text/markdown',
    }

    // Use API key if available (for higher rate limits)
    const apiKey = process.env.JINA_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(apiUrl, { headers })

    if (!response.ok) {
      throw new Error(`Jina Reader error: ${response.status} ${response.statusText}`)
    }

    const markdown = await response.text()

    if (!markdown.trim()) {
      throw new Error('Jina Reader returned empty content')
    }

    return markdown
  },
}
