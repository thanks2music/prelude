import pLimit from 'p-limit'
import { normalizePageUrl, toLocalPath } from './url.js'
import { extractDocLinks } from './md.js'
import { saveFile } from './fs.js'
import { fetchWithFallback, closeBrowser, type CrawlOptions } from './adapters/index.js'

/**
 * Crawl a documentation site and save as markdown files
 */
export async function crawl(entry: string, options: CrawlOptions): Promise<void> {
  const entryUrl = normalizePageUrl(entry)
  const visited = new Set<string>()
  const failed: string[] = []

  // Concurrency limiter
  const limit = pLimit(options.concurrency || 3)

  console.log(`Starting crawl: ${entryUrl}`)
  if (options.useJina) {
    console.log('Using Jina Reader API (external)')
  } else {
    console.log('Using Playwright (local)')
  }
  console.log('')

  try {
    // Fetch entry page
    const { content, adapter } = await fetchWithFallback(entryUrl, options)
    visited.add(entryUrl.toString())

    const localPath = `${options.outDir}/${toLocalPath(entryUrl)}`
    await saveFile(localPath, content)
    console.log(`[${adapter}] Saved: ${localPath}`)

    // Extract links
    const links = extractDocLinks(content, entryUrl)
    console.log(`Found ${links.length} links\n`)

    // BFS crawl with depth limit
    const maxDepth = options.depth ?? 1
    const queue: Array<{ url: URL; depth: number }> = maxDepth > 0
      ? links.map((url) => ({ url, depth: 1 }))
      : []

    while (queue.length > 0) {
      // Process in batches
      const batch = queue.splice(0, options.concurrency || 3)

      await Promise.all(
        batch.map((item) =>
          limit(async () => {
            const { url, depth } = item

            // Skip if already visited
            if (visited.has(url.toString())) {
              return
            }
            visited.add(url.toString())

            try {
              const result = await fetchWithFallback(url, options)
              const path = `${options.outDir}/${toLocalPath(url)}`
              await saveFile(path, result.content)
              console.log(`[${result.adapter}] Saved: ${path}`)

              // Add new links if within depth limit
              if (depth < maxDepth) {
                const newLinks = extractDocLinks(result.content, url)
                for (const link of newLinks) {
                  if (!visited.has(link.toString())) {
                    queue.push({ url: link, depth: depth + 1 })
                  }
                }
              }
            } catch (error) {
              const msg = error instanceof Error ? error.message : String(error)
              console.warn(`Failed: ${url} - ${msg}`)
              failed.push(url.toString())
            }
          })
        )
      )
    }

    // Summary
    console.log('')
    console.log('='.repeat(50))
    console.log(`Done! Saved ${visited.size} pages to ${options.outDir}`)
    if (failed.length > 0) {
      console.log(`Failed: ${failed.length} pages`)
      if (options.verbose) {
        failed.forEach((url) => console.log(`  - ${url}`))
      }
    }
  } finally {
    // Clean up browser
    await closeBrowser()
  }
}
