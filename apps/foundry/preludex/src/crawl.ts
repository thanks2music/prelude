import { normalizePageUrl, toMdUrl, toLocalPath } from './url.js'
import { fetchText } from './fetcher.js'
import { extractDocLinks } from './md.js'
import { saveFile } from './fs.js'

export async function crawl(entry: string, outDir: string): Promise<void> {
  const entryUrl = normalizePageUrl(entry)
  const mdUrl = toMdUrl(entryUrl)

  console.log(`Fetching: ${mdUrl}`)
  const md = await fetchText(mdUrl)
  const localPath = `${outDir}/${toLocalPath(entryUrl)}`
  await saveFile(localPath, md)
  console.log(`Saved: ${localPath}`)

  const links = extractDocLinks(md, entryUrl)
  console.log(`Found ${links.length} links`)

  for (const link of links) {
    try {
      const linkMdUrl = toMdUrl(link)
      console.log(`Fetching: ${linkMdUrl}`)
      const content = await fetchText(linkMdUrl)
      const path = `${outDir}/${toLocalPath(link)}`
      await saveFile(path, content)
      console.log(`Saved: ${path}`)
    } catch (e) {
      console.warn(`Skip: ${link.toString()}`)
    }
  }

  console.log('Done!')
}
