export function extractDocLinks(md: string, base: URL): URL[] {
  const links = new Set<string>()

  // Markdown形式: [text](url)
  const mdRegex = /\[[^\]]+\]\(([^)]+)\)/g

  // MDX/JSX形式: href="/docs/..." または href="https://..."
  const hrefRegex = /href=["']([^"']+)["']/g

  const patterns = [mdRegex, hrefRegex]

  for (const regex of patterns) {
    for (const match of md.matchAll(regex)) {
      try {
        const raw = match[1].split('#')[0]
        if (!raw || raw.startsWith('mailto:')) continue

        const url = new URL(raw, base)
        if (
          url.origin === base.origin &&
          url.pathname.startsWith('/docs/') &&
          !url.pathname.match(/\.\w+$/) // .md, .png 等の拡張子を除外
        ) {
          links.add(url.toString())
        }
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return [...links].map((u) => new URL(u))
}
