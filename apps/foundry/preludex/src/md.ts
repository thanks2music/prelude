export function extractDocLinks(md: string, base: URL): URL[] {
  const links = new Set<string>()
  const regex = /\[[^\]]+\]\(([^)]+)\)/g

  for (const match of md.matchAll(regex)) {
    try {
      const raw = match[1].split('#')[0]
      const url = new URL(raw, base)
      if (
        url.origin === base.origin &&
        url.pathname.startsWith('/docs/') &&
        !url.pathname.includes('.')
      ) {
        links.add(url.toString())
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return [...links].map((u) => new URL(u))
}
