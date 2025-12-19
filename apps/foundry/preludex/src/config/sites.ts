/**
 * Site-specific configuration for Playwright adapter
 */
export interface SiteConfig {
  /** CSS selector for main content */
  contentSelector: string

  /** CSS selectors to remove (navigation, footer, etc.) */
  removeSelectors: string[]

  /** CSS selector to wait for before extracting content */
  waitForSelector: string

  /** Optional: Document framework detection */
  framework?: 'docusaurus' | 'vitepress' | 'starlight' | 'mkdocs' | 'sphinx' | 'gitbook' | 'custom'

  /** Optional: Base path for docs (e.g., '/docs/') */
  docsBasePath?: string
}

/**
 * Site-specific configurations
 */
export const siteConfigs: Record<string, SiteConfig> = {
  // Cloudflare Developers Docs (Starlight)
  'developers.cloudflare.com': {
    contentSelector: '[data-pagefind-body], main article, main',
    removeSelectors: [
      'nav',
      'header',
      'footer',
      'script',
      'style',
      'noscript',
      'aside',
      'iframe',
      'astro-island',
      'starlight-tabs-restore',
      'astro-breadcrumbs',
      '.Breadcrumb',
      '.DocsSidebar',
      '.DocsFooter',
      '.PageFooter',
      '.feedback',
      '.DocsToc',
      '.copy-button',
      '.CopyCodeButton',
      '[class*="Footer"]',
      // Page navigation links
      '[class*="pagination"]',
      '[class*="Pagination"]',
      // Edit/issue links
      '[href*="github.com"][href*="edit"]',
    ],
    waitForSelector: '[data-pagefind-body], article, main',
    framework: 'starlight',
  },

  // OpenAI Platform Docs
  'platform.openai.com': {
    contentSelector: 'main',
    removeSelectors: [
      'nav',
      'header',
      'footer',
      '[role="navigation"]',
      '.sidebar',
      '.toc',
      '.breadcrumb',
    ],
    waitForSelector: 'main',
    framework: 'custom',
    docsBasePath: '/docs/',
  },

  // xAI Docs
  'docs.x.ai': {
    contentSelector: 'article, main, .content',
    removeSelectors: ['nav', 'header', 'footer', 'aside', '.sidebar'],
    waitForSelector: 'article, main',
    framework: 'custom',
  },

  // Google AI (Gemini) Docs
  'ai.google.dev': {
    contentSelector: 'article, main',
    removeSelectors: ['nav', 'header', 'footer', 'aside', '.devsite-nav'],
    waitForSelector: 'article, main',
    framework: 'custom',
    docsBasePath: '/docs/',
  },

  // Docusaurus sites (common pattern)
  '__docusaurus__': {
    contentSelector: '.theme-doc-markdown, article',
    removeSelectors: [
      '.navbar',
      '.footer',
      '.pagination-nav',
      '.theme-doc-sidebar-container',
      '.theme-doc-toc-desktop',
      '.theme-doc-breadcrumbs',
    ],
    waitForSelector: '.theme-doc-markdown, article',
    framework: 'docusaurus',
  },

  // VitePress sites (common pattern)
  '__vitepress__': {
    contentSelector: '.vp-doc, .content',
    removeSelectors: [
      '.VPNav',
      '.VPSidebar',
      '.VPFooter',
      '.VPDocAside',
      '.outline',
    ],
    waitForSelector: '.vp-doc, .content',
    framework: 'vitepress',
  },

  // Starlight (Astro) sites
  '__starlight__': {
    contentSelector: '.sl-markdown-content, article, [data-pagefind-body]',
    removeSelectors: [
      'nav',
      'header',
      'footer',
      '.sidebar',
      '.right-sidebar',
      'script',
      'style',
      'astro-island',
      'starlight-tabs-restore',
      'astro-breadcrumbs',
      '[data-application-name]',
      '.feedback-widget',
      '.page-footer',
      '.copy-button',
    ],
    waitForSelector: '.sl-markdown-content, article',
    framework: 'starlight',
  },

  // MkDocs Material sites
  '__mkdocs__': {
    contentSelector: '.md-content, article',
    removeSelectors: [
      '.md-header',
      '.md-footer',
      '.md-sidebar',
      '.md-nav',
    ],
    waitForSelector: '.md-content, article',
    framework: 'mkdocs',
  },

  // Sphinx sites (including Furo theme)
  '__sphinx__': {
    contentSelector: '#furo-main-content, .document, .body, article[role="main"], .rst-content',
    removeSelectors: [
      // Common Sphinx elements
      '.sphinxsidebar',
      '.related',
      '.footer',
      '.clearer',
      // Furo theme elements
      '.sidebar-drawer',
      '.toc-drawer',
      '.toc-scroll',
      '.toc-tree-container',
      '.page-toc',
      '.content-icon-container',
      '.back-to-top',
      '.header-article',
      '.announcement',
      // Read the Docs theme elements
      '.wy-nav-side',
      '.wy-nav-top',
      '.rst-footer-buttons',
      '.wy-side-nav-search',
      // Copy buttons
      '.copybtn',
      '.copybutton',
      'button.copy',
    ],
    waitForSelector: '#furo-main-content, .document, article[role="main"]',
    framework: 'sphinx',
  },

  // GitBook sites (modern 2024+ structure)
  '__gitbook__': {
    contentSelector: 'main',
    removeSelectors: [
      // Header and navigation
      'banner',
      'header',
      '[role="banner"]',
      // Sidebar
      'complementary',
      '[role="complementary"]',
      // Footer
      'contentinfo',
      '[role="contentinfo"]',
      // Breadcrumb
      'nav[aria-label="Breadcrumb"]',
      '[aria-label="Breadcrumb"]',
      // Previous/Next navigation (adjacent to main content)
      'a[href][class*="Previous"]',
      'a[href][class*="Next"]',
      // Copy button
      'button[aria-label="Copy page"]',
      '[aria-label="Copy page"]',
      // More button
      'button[aria-label="More"]',
      // Feedback section ("Was this helpful?")
      '[class*="feedback"]',
      // Table of contents sidebar
      '[data-testid="table-of-contents"]',
      '[data-testid="toc-scroll-container"]',
      // Announcement banners
      '[class*="announcement"]',
    ],
    waitForSelector: 'main',
    framework: 'gitbook',
  },
}

/**
 * Default configuration for unknown sites
 */
export const defaultSiteConfig: SiteConfig = {
  contentSelector: 'main, article, .content, .docs-content, #content',
  removeSelectors: [
    'nav',
    'header',
    'footer',
    'aside',
    '.sidebar',
    '.navigation',
    '.toc',
    '.breadcrumb',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
  ],
  waitForSelector: 'main, article, .content',
  framework: 'custom',
}

/**
 * Get site configuration for a URL
 */
export function getSiteConfig(url: URL): SiteConfig {
  // Check for exact hostname match
  if (siteConfigs[url.hostname]) {
    return siteConfigs[url.hostname]
  }

  // Return default config (framework detection happens after page load)
  return defaultSiteConfig
}

/**
 * Get framework-specific configuration
 */
export function getFrameworkConfig(
  framework: SiteConfig['framework']
): SiteConfig | null {
  const frameworkKey = `__${framework}__`
  return siteConfigs[frameworkKey] || null
}

/**
 * Framework detection patterns
 * Each pattern includes CSS selectors or HTML content patterns to identify a framework
 */
export interface FrameworkPattern {
  framework: NonNullable<SiteConfig['framework']>
  /** CSS selectors that indicate this framework */
  selectors: string[]
  /** HTML content patterns (e.g., meta tags, script names) */
  htmlPatterns: RegExp[]
  /** Confidence weight (higher = more reliable) */
  weight: number
}

export const frameworkPatterns: FrameworkPattern[] = [
  {
    framework: 'docusaurus',
    selectors: [
      '.theme-doc-markdown',
      '.docusaurus-highlight-code-line',
      '.navbar__brand',
      '.menu__link',
      // More specific Docusaurus selectors
      '[class*="docusaurus"]',
      '.pagination-nav',
    ],
    htmlPatterns: [
      /docusaurus/i,
      /<meta[^>]*generator[^>]*Docusaurus/i,
      /\/@docusaurus\//,
      /docusaurus\.config/,
    ],
    weight: 10,
  },
  {
    framework: 'vitepress',
    selectors: [
      '.vp-doc',
      '.VPNav',
      '.VPSidebar',
      '.VPContent',
      '.vp-code',
      '[class*="VPHome"]',
    ],
    htmlPatterns: [
      /vitepress/i,
      /<meta[^>]*generator[^>]*VitePress/i,
      /vitepress\.css/,
      /__VP_/,
    ],
    weight: 10,
  },
  {
    framework: 'starlight',
    selectors: [
      '.sl-markdown-content',
      '[data-starlight]',
      '.starlight-aside',
      'astro-island',
    ],
    htmlPatterns: [
      /starlight/i,
      /<meta[^>]*generator[^>]*Astro/i,
      /Starlight/,
      /@astrojs\/starlight/,
    ],
    weight: 10,
  },
  {
    framework: 'mkdocs',
    selectors: [
      '.md-content',
      '.md-header',
      '.md-sidebar',
      '.md-nav',
      '[data-md-component]',
    ],
    htmlPatterns: [
      /mkdocs/i,
      /<meta[^>]*generator[^>]*mkdocs/i,
      /material-?for-?mkdocs/i,
      /mkdocs\.yml/,
    ],
    weight: 10,
  },
  {
    framework: 'sphinx',
    selectors: [
      // Traditional Sphinx / Read the Docs theme
      '.sphinxsidebar',
      '.document',
      '.bodywrapper',
      '[class*="sphinx"]',
      '.rst-content',
      // Furo theme (modern Sphinx theme)
      '#furo-main-content',
      '.furo-main',
      '[href*="sphinx-doc.org"]',
    ],
    htmlPatterns: [
      /sphinx/i,
      /<meta[^>]*generator[^>]*Sphinx/i,
      /sphinx_rtd_theme/,
      /_static\/sphinx/,
      // Furo theme patterns
      /pradyunsg.*furo/i,
      /furo\.css/i,
      /Made with.*Sphinx/i,
    ],
    weight: 10,
  },
  {
    framework: 'gitbook',
    selectors: [
      // Legacy GitBook selectors
      '.gitbook-root',
      '[data-gitbook]',
      '.space-navigation',
      '.page-inner',
      // Modern GitBook selectors (2024+)
      '[class*="page-width-default"]',
      '[class*="site-width-default"]',
      '[data-testid="table-of-contents"]',
      '[href*="gitbook.com"][href*="utm_source"]',
    ],
    htmlPatterns: [
      /gitbook/i,
      /app\.gitbook\.com/,
      /gitbook-x-reason/,
      /Powered by GitBook/i,
      /gitbook\.io/,
    ],
    weight: 10,
  },
]

/**
 * Detect documentation framework from HTML content
 * Returns the detected framework and confidence score
 */
export function detectFramework(html: string): {
  framework: SiteConfig['framework']
  confidence: number
} {
  const scores: Record<string, number> = {}

  for (const pattern of frameworkPatterns) {
    let score = 0

    // Check HTML patterns
    for (const regex of pattern.htmlPatterns) {
      if (regex.test(html)) {
        score += pattern.weight
      }
    }

    // Check for selector patterns in HTML (simplified check)
    for (const selector of pattern.selectors) {
      // Convert CSS selector to a simple pattern
      const selectorPattern = selector
        .replace(/\./g, 'class="[^"]*')
        .replace(/\[([^\]]+)\]/g, '$1')

      if (new RegExp(selectorPattern, 'i').test(html)) {
        score += pattern.weight / 2
      }
    }

    if (score > 0) {
      scores[pattern.framework] = score
    }
  }

  // Find framework with highest score
  let maxFramework: SiteConfig['framework'] = 'custom'
  let maxScore = 0

  for (const [framework, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxFramework = framework as SiteConfig['framework']
    }
  }

  // Return 'custom' if confidence is too low
  const confidence = maxScore > 0 ? Math.min(maxScore / 30, 1) : 0

  return {
    framework: maxFramework,
    confidence,
  }
}

/**
 * Detect framework from a Playwright page
 * More reliable than HTML string detection as it can check actual DOM
 */
export async function detectFrameworkFromPage(
  page: import('playwright').Page
): Promise<{
  framework: SiteConfig['framework']
  confidence: number
}> {
  const results = await page.evaluate((patterns) => {
    const scores: Record<string, number> = {}

    for (const pattern of patterns) {
      let score = 0

      // Check selectors directly in DOM
      for (const selector of pattern.selectors) {
        try {
          if (document.querySelector(selector)) {
            score += pattern.weight
          }
        } catch {
          // Invalid selector, skip
        }
      }

      // Check HTML patterns
      const html = document.documentElement.outerHTML
      for (const patternStr of pattern.htmlPatterns) {
        const regex = new RegExp(patternStr)
        if (regex.test(html)) {
          score += pattern.weight / 2
        }
      }

      if (score > 0) {
        scores[pattern.framework] = score
      }
    }

    return scores
  }, frameworkPatterns.map(p => ({
    ...p,
    htmlPatterns: p.htmlPatterns.map(r => r.source),
  })))

  // Find framework with highest score
  let maxFramework: SiteConfig['framework'] = 'custom'
  let maxScore = 0

  for (const [framework, score] of Object.entries(results)) {
    if (score > maxScore) {
      maxScore = score
      maxFramework = framework as SiteConfig['framework']
    }
  }

  const confidence = maxScore > 0 ? Math.min(maxScore / 30, 1) : 0

  return {
    framework: maxFramework,
    confidence,
  }
}
