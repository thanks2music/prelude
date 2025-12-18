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
    contentSelector: '.sl-markdown-content, main',
    removeSelectors: [
      'nav',
      'header',
      'footer',
      '.sidebar',
      '.right-sidebar',
    ],
    waitForSelector: '.sl-markdown-content, main',
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

  // TODO: Auto-detect framework from HTML structure
  // For now, return default config
  return defaultSiteConfig
}

/**
 * Detect documentation framework from page content
 * TODO: Implement framework detection based on HTML/JS signatures
 */
export async function detectFramework(
  _html: string
): Promise<SiteConfig['framework']> {
  // Placeholder for future implementation
  return 'custom'
}
