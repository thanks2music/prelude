#!/usr/bin/env node
import { crawl } from './crawl.js'
import type { CrawlOptions } from './adapters/types.js'

const VERSION = '0.2.0'

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): { url: string; options: CrawlOptions } {
  const url = args[0]

  if (!url || url === '--help' || url === '-h') {
    printHelp()
    process.exit(0)
  }

  if (url === '--version' || url === '-v') {
    console.log(`preludex v${VERSION}`)
    process.exit(0)
  }

  const options: CrawlOptions = {
    outDir: 'docs',
    useJina: false,
    useSitemap: false,
    depth: 1,
    concurrency: 3,
    verbose: false,
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--out':
      case '-o':
        options.outDir = args[++i] || 'docs'
        break
      case '--use-jina':
        options.useJina = true
        break
      case '--use-sitemap':
        options.useSitemap = true
        break
      case '--depth':
      case '-d': {
        const d = parseInt(args[++i], 10)
        options.depth = isNaN(d) ? 1 : d
        break
      }
      case '--concurrency':
      case '-c': {
        const c = parseInt(args[++i], 10)
        options.concurrency = isNaN(c) || c < 1 ? 3 : c
        break
      }
      case '--verbose':
        options.verbose = true
        break
    }
  }

  return { url, options }
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
preludex v${VERSION} - Documentation site downloader

Usage:
  preludex <url> [options]

Options:
  --out, -o <dir>       Output directory (default: docs)
  --depth, -d <n>       Maximum crawl depth (default: 1)
  --concurrency, -c <n> Parallel requests (default: 3)
  --use-jina            Use Jina Reader API (external, opt-in)
  --use-sitemap         Use sitemap.xml for URL discovery
  --verbose             Show detailed output
  --help, -h            Show this help
  --version, -v         Show version

Examples:
  # Default (Playwright + turndown, local)
  preludex https://platform.openai.com/docs --out docs/openai

  # Use Jina Reader API (external)
  preludex https://platform.openai.com/docs --out docs/openai --use-jina

  # Crawl with depth 3
  preludex https://example.com/docs --out docs/example --depth 3

  # Claude Docs (uses MDX adapter automatically)
  preludex https://platform.claude.com/docs --out docs/claude
`)
}

// Main
const [, , ...args] = process.argv
const { url, options } = parseArgs(args)

try {
  await crawl(url, options)
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${msg}`)
  process.exit(1)
}
