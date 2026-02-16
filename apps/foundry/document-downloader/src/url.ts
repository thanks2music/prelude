import { resolve } from 'node:path'
import { docPatterns } from './config/patterns.js'

/**
 * Normalize a URL by removing hash and search params
 */
export function normalizePageUrl(input: string): URL {
  const url = new URL(input)
  url.hash = ''
  url.search = ''
  return url
}

/**
 * Convert page URL to MDX/MD URL (for MDX adapter)
 */
export function toMdUrl(pageUrl: URL): URL {
  if (pageUrl.pathname.endsWith('.md') || pageUrl.pathname.endsWith('.mdx')) {
    return pageUrl
  }
  const md = new URL(pageUrl.toString())
  md.pathname = md.pathname.replace(/\/$/, '') + '.md'
  return md
}

/**
 * Detect the base path for documentation from URL
 * e.g., https://example.com/docs/getting-started -> /docs/
 */
export function detectBasePath(url: URL): string | undefined {
  const pathParts = url.pathname.split('/').filter(Boolean)

  for (const part of pathParts) {
    if (docPatterns.includes(part.toLowerCase() as (typeof docPatterns)[number])) {
      return `/${part}/`
    }
  }

  return undefined
}

/**
 * Convert URL to local file path
 *
 * Examples:
 *   https://example.com/docs/api/overview -> api/overview.md
 *   https://example.com/docs/getting-started -> getting-started.md
 *   https://example.com/docs/ -> index.md
 */
export function toLocalPath(pageUrl: URL): string {
  const parts = pageUrl.pathname.split('/').filter(Boolean)

  // Find documentation root (docs, documentation, api, guide, etc.)
  let startIndex = 0

  for (let i = 0; i < parts.length; i++) {
    if (docPatterns.includes(parts[i].toLowerCase() as (typeof docPatterns)[number])) {
      startIndex = i + 1
      break
    }
  }

  // Get path after docs root
  const pathParts = parts.slice(startIndex)

  // Handle empty path (root docs page)
  if (pathParts.length === 0) {
    return 'index.md'
  }

  // Get file name (last part)
  const file = pathParts.pop() || 'index'

  // Build path
  const dir = pathParts.join('/')
  const fileName = `${file}.md`

  return dir ? `${dir}/${fileName}` : fileName
}

/**
 * GitHub repository information
 */
export interface GitHubRepoInfo {
  owner: string
  repo: string
  branch: string
  path?: string
  isBlob: boolean
}

/**
 * GitHub URLかどうかを判定（除外URL対応）
 */
export function isGitHubUrl(url: URL): boolean {
  if (url.hostname !== 'github.com') return false

  const excludedPaths = [
    '/issues',
    '/pulls',
    '/releases',
    '/wiki',
    '/settings',
    '/actions',
    '/security',
    '/graphs',
    '/projects',
    '/discussions',
  ]

  const path = url.pathname.toLowerCase()

  // 除外パスにマッチする場合は false
  for (const excluded of excludedPaths) {
    if (path.includes(excluded)) return false
  }

  // /owner/repo の形式であることを確認
  return /^\/[^/]+\/[^/]+/.test(url.pathname)
}

/**
 * GitHub URLをパース（スラッシュ含むブランチ名対応）
 */
export function parseGitHubUrl(url: URL): GitHubRepoInfo | null {
  const decodedPath = decodeURIComponent(url.pathname)

  // .git サフィックスを除去
  // /owner/repo(.git)?/(tree|blob)/<branch...>/<path...>
  const match = decodedPath.match(
    /^\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(tree|blob)\/(.+))?$/
  )

  if (!match) return null

  const [, owner, repo, type, tail] = match

  let branch = '' // デフォルトブランチはAPI取得で決定
  let path: string | undefined

  if (type && tail) {
    // ブランチ名は可変長（スラッシュ含む: feature/foo/bar）
    // 最長一致でブランチを切り出す
    // 例: feature/foo/docs/readme.md → branch=feature/foo, path=docs/readme.md
    const parts = tail.split('/')

    if (parts.length >= 2) {
      // 後続パスが存在する最長のブランチ名を採用
      for (let i = parts.length - 1; i >= 1; i--) {
        const candidateBranch = parts.slice(0, i).join('/')
        const candidatePath = parts.slice(i).join('/')
        if (candidatePath) {
          branch = candidateBranch
          path = candidatePath
          break
        }
      }
    } else {
      // パスなし、ブランチのみ
      branch = tail
    }
  }

  return {
    owner,
    repo,
    branch: branch || '', // 空の場合はAPI取得
    path: path || undefined,
    isBlob: type === 'blob',
  }
}

/**
 * GitHub URLをraw URLに変換
 */
export function toGitHubRawUrl(info: GitHubRepoInfo, filePath: string): string {
  return `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${info.branch}/${filePath}`
}

/**
 * GitHub上の相対リンクを絶対URLに変換
 */
export function resolveGitHubLink(
  link: string,
  current: {
    owner: string
    repo: string
    branch: string
    currentPath: string
  }
): URL | null {
  // 1. アンカーのみ (#section) は無視
  if (link.startsWith('#')) return null

  // 2. 絶対URL（http/https）はそのまま
  if (/^https?:\/\//.test(link)) {
    return new URL(link)
  }

  // 3. ルート相対パス（/から始まる）
  if (link.startsWith('/')) {
    return new URL(
      `https://github.com/${current.owner}/${current.repo}/blob/${current.branch}${link}`,
      'https://github.com'
    )
  }

  // 4. 相対パス（./ または ../）
  const currentDir = current.currentPath.split('/').slice(0, -1).join('/')
  const resolved = resolve('/', currentDir, link).slice(1)

  return new URL(
    `https://github.com/${current.owner}/${current.repo}/blob/${current.branch}/${resolved}`,
    'https://github.com'
  )
}
