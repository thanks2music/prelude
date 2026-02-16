import { chromium, type Browser, type Page } from 'playwright'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import type { SiteAdapter } from './types.js'
import {
  getSiteConfig,
  getFrameworkConfig,
  detectFrameworkFromPage,
  defaultSiteConfig,
  type SiteConfig,
} from '../config/sites.js'

// Initialize turndown with GFM support
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})
turndown.use(gfm)

// Custom rule: Preserve code block language
turndown.addRule('fencedCodeBlock', {
  filter: (node) => {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild !== null &&
      node.firstChild.nodeName === 'CODE'
    )
  },
  replacement: (_content, node) => {
    const code = node.firstChild as HTMLElement
    const className = code.getAttribute('class') || ''
    const langMatch = className.match(/language-(\w+)/)
    const lang = langMatch ? langMatch[1] : ''
    const text = code.textContent || ''
    return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`
  },
})

// Browser instance (reused across calls)
let browser: Browser | null = null

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('Launching browser...')
    browser = await chromium.launch({
      headless: true,
    })
  }
  return browser
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

/**
 * Extract and clean HTML content from page
 */
async function extractContent(page: Page, config: SiteConfig): Promise<string> {
  // Global cleanup: Remove scripts, styles, and common noise elements
  await page.evaluate(() => {
    // Remove all script and style elements globally
    document.querySelectorAll('script, style, noscript').forEach((el) => el.remove())

    // Remove JSON-LD and other metadata
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove())

    // Remove common web component elements that contain JavaScript
    document.querySelectorAll('astro-island, starlight-tabs-restore, astro-breadcrumbs').forEach((el) => el.remove())
  })

  // Remove config-specific unwanted elements
  for (const selector of config.removeSelectors) {
    await page.evaluate((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove())
    }, selector)
  }

  // VitePress/Docusaurus: Copy language from parent div to code element and remove labels
  await page.evaluate(() => {
    // Find all code blocks and copy language from parent
    document.querySelectorAll('div[class*="language-"] pre > code').forEach((code) => {
      const parent = code.parentElement?.parentElement
      if (parent) {
        const match = parent.className.match(/language-(\w+)/)
        if (match && !code.className.includes('language-')) {
          code.classList.add(`language-${match[1]}`)
        }
      }
    })
    // Remove language labels
    document.querySelectorAll('.vp-code-group span.lang, div[class*="language-"] > span.lang').forEach((el) => el.remove())
  })

  // Extract main content
  const html = await page.evaluate((selector) => {
    const el = document.querySelector(selector)
    return el ? el.innerHTML : document.body.innerHTML
  }, config.contentSelector)

  return html
}

/**
 * Clean common footer patterns from markdown
 */
function cleanFooterPatterns(markdown: string): string {
  // Remove common site-wide footer sections
  // These often appear as lists starting with bold headers like "Resources", "Support", etc.
  const footerPatterns = [
    // Match footer sections: "- **Resources**" followed by link lists
    /\n-\s+\*\*Resources\*\*[\s\S]*?(?=\n## |\n# |$)/gi,
    /\n-\s+\*\*Support\*\*[\s\S]*?(?=\n## |\n# |\n-\s+\*\*|$)/gi,
    /\n-\s+\*\*Company\*\*[\s\S]*?(?=\n## |\n# |\n-\s+\*\*|$)/gi,
    /\n-\s+\*\*Tools\*\*[\s\S]*?(?=\n## |\n# |\n-\s+\*\*|$)/gi,
    /\n-\s+\*\*Community\*\*[\s\S]*?(?=\n## |\n# |\n-\s+\*\*|$)/gi,
    // Copyright notices
    /\n-\s+©\s+\d{4}.*$/gim,
    // Privacy/Terms links at end
    /\n-\s+\[Privacy Policy\].*$/gim,
    /\n-\s+\[Terms of Use\].*$/gim,
    /\n-\s+\[Report Security Issues\].*$/gim,
    /\n-\s+\[Trademark\].*$/gim,
    // Cookie settings
    /\n-\s+!\[privacy options\].*Cookie Settings.*$/gim,

    // GitBook-specific patterns
    // Note: Previous/Next links are kept as they're useful for navigation
    // "Last updated X ago" line
    /\nLast updated.*(?:ago|yesterday|today)\s*$/gim,
    // "Was this helpful?" section
    /\nWas this helpful\?\s*$/gim,
  ]

  let cleaned = markdown
  for (const pattern of footerPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }

  // GitBook: Fix empty headings followed by anchor links
  // Pattern: "## \n\n[](#anchor)\n\nHeading Text" -> "## Heading Text"
  cleaned = cleaned.replace(/^(#{2,})\s*\n\n\[]\(#[^)]+\)\n\n(.+)$/gm, '$1 $2')

  // Clean up trailing whitespace and multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  return cleaned
}

/**
 * Convert relative URLs to absolute
 */
function absolutizeUrls(html: string, baseUrl: URL): string {
  // Convert href and src attributes to absolute URLs
  return html
    .replace(/href="(?!http|mailto|#)([^"]+)"/g, (_, path) => {
      try {
        const absolute = new URL(path, baseUrl).toString()
        return `href="${absolute}"`
      } catch {
        return `href="${path}"`
      }
    })
    .replace(/src="(?!http|data:)([^"]+)"/g, (_, path) => {
      try {
        const absolute = new URL(path, baseUrl).toString()
        return `src="${absolute}"`
      } catch {
        return `src="${path}"`
      }
    })
}

/**
 * Playwright Adapter
 * Default adapter for SPA/HTML documentation sites
 */
export const playwrightAdapter: SiteAdapter = {
  name: 'playwright',

  match: (): boolean => {
    // Matches all URLs as fallback
    return true
  },

  fetchMarkdown: async (url: URL): Promise<string> => {
    const browserInstance = await getBrowser()
    const page = await browserInstance.newPage()

    try {
      let config = getSiteConfig(url)
      const isDefaultConfig = config === defaultSiteConfig

      // Navigate to page with domcontentloaded (faster than networkidle)
      await page.goto(url.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // If using default config, try to auto-detect framework
      if (isDefaultConfig) {
        const { framework, confidence } = await detectFrameworkFromPage(page)
        if (framework !== 'custom' && confidence >= 0.3) {
          const frameworkConfig = getFrameworkConfig(framework)
          if (frameworkConfig) {
            console.log(`  [auto-detect] Framework: ${framework} (confidence: ${Math.round(confidence * 100)}%)`)
            config = frameworkConfig
          }
        }
      }

      // Wait for main content selector
      try {
        await page.waitForSelector(config.waitForSelector, { timeout: 15000 })
      } catch {
        // If main selector times out, try waiting a bit more for SPAs
        await page.waitForTimeout(2000)
      }

      // Extract content
      const html = await extractContent(page, config)

      // Convert URLs to absolute
      const absoluteHtml = absolutizeUrls(html, url)

      // Convert to markdown
      const markdown = turndown.turndown(absoluteHtml)

      // Clean common footer patterns
      const cleanedMarkdown = cleanFooterPatterns(markdown)

      return cleanedMarkdown
    } finally {
      await page.close()
    }
  },
}
