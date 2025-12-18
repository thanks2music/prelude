export async function fetchText(url: URL): Promise<string> {
  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 preludex',
      Accept: 'text/markdown,text/plain,text/html,*/*',
    },
  })

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${url}`)
  }

  const text = await res.text()
  if (text.trim().toLowerCase().startsWith('<!doctype')) {
    throw new Error('HTML returned, not markdown')
  }

  return text
}
