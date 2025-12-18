export function normalizePageUrl(input: string): URL {
  const url = new URL(input)
  url.hash = ''
  url.search = ''
  return url
}

export function toMdUrl(pageUrl: URL): URL {
  if (pageUrl.pathname.endsWith('.md')) return pageUrl
  const md = new URL(pageUrl.toString())
  md.pathname = md.pathname.replace(/\/$/, '') + '.md'
  return md
}

export function toLocalPath(pageUrl: URL): string {
  const parts = pageUrl.pathname.split('/').filter(Boolean)
  const docsIndex = parts.indexOf('docs')
  const sliced = parts.slice(docsIndex + 2)
  const file = sliced.pop() || 'index'
  return [...sliced, `${file}.md`].join('/')
}
