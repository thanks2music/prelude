import type { SiteAdapter } from './types.js'
import { isGitHubUrl, parseGitHubUrl, toGitHubRawUrl } from '../url.js'
import { defaults } from '../config/defaults.js'

/**
 * GitHub API response types
 */
interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size: number
  url: string
}

interface GitHubTreeResponse {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

/**
 * リポジトリのデフォルトブランチを取得
 */
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': defaults.userAgent,
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  })

  if (!response.ok) {
    console.warn(`Failed to get default branch: ${response.status}`)
    return 'main'
  }

  const data = (await response.json()) as { default_branch?: string }
  return data.default_branch || 'main'
}

/**
 * Markdown拡張子の判定
 */
const MARKDOWN_EXTENSIONS = ['.md', '.MD', '.markdown', '.mdx']

function isMarkdownFile(path: string): boolean {
  return (
    MARKDOWN_EXTENSIONS.some((ext) => path.endsWith(ext)) ||
    /^README$/i.test(path.split('/').pop() || '')
  )
}

/**
 * Fetch file list from GitHub repository using Trees API
 */
async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubTreeItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': defaults.userAgent,
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  })

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    )
  }

  const data = (await response.json()) as GitHubTreeResponse

  if (data.truncated) {
    console.warn('Warning: Repository tree is truncated (>100,000 entries)')
    console.warn('Falling back to Contents API for docs/ directory')
    return await fetchDocsDirWithContentsAPI(owner, repo, branch)
  }

  return data.tree
}

/**
 * Contents APIでdocs/配下を再帰的に取得（truncated時のフォールバック）
 */
async function fetchDocsDirWithContentsAPI(
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubTreeItem[]> {
  const items: GitHubTreeItem[] = []
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': defaults.userAgent,
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  }

  // README取得
  try {
    const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme?ref=${branch}`
    const readmeRes = await fetch(readmeUrl, { headers })

    if (readmeRes.ok) {
      const readme = (await readmeRes.json()) as {
        path: string
        sha: string
        size: number
        url: string
      }
      items.push({
        path: readme.path,
        type: 'blob',
        mode: '100644',
        sha: readme.sha,
        size: readme.size,
        url: readme.url,
      })
    }
  } catch (error) {
    console.warn('README not found')
  }

  // docs/配下を再帰取得
  async function fetchDir(path: string): Promise<void> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`

    try {
      const res = await fetch(url, { headers })
      if (!res.ok) return

      const contents = (await res.json()) as Array<{
        type: string
        path: string
        sha: string
        size: number
        url: string
      }>

      if (!Array.isArray(contents)) return

      for (const item of contents) {
        if (item.type === 'file') {
          items.push({
            path: item.path,
            type: 'blob',
            mode: '100644',
            sha: item.sha,
            size: item.size,
            url: item.url,
          })
        } else if (item.type === 'dir') {
          await fetchDir(item.path)
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch directory: ${path}`)
    }
  }

  await fetchDir('docs')

  return items
}

/**
 * Filter markdown files from tree
 */
function filterMarkdownFiles(
  tree: GitHubTreeItem[],
  basePath?: string
): GitHubTreeItem[] {
  return tree.filter((item) => {
    if (item.type !== 'blob') return false

    if (!isMarkdownFile(item.path)) return false

    if (basePath && !item.path.startsWith(basePath)) return false

    return true
  })
}

/**
 * Fetch raw markdown content from GitHub
 */
export async function fetchRawMarkdown(rawUrl: string): Promise<string> {
  const response = await fetch(rawUrl, {
    headers: {
      'User-Agent': defaults.userAgent,
      Accept: 'text/plain,text/markdown,*/*',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${rawUrl}`)
  }

  return response.text()
}

/**
 * GitHub Adapter
 * For fetching markdown files directly from GitHub repositories
 */
export const githubAdapter: SiteAdapter = {
  name: 'github',

  match: (url: URL): boolean => {
    return isGitHubUrl(url)
  },

  fetchMarkdown: async (url: URL): Promise<string> => {
    const info = parseGitHubUrl(url)

    if (!info) {
      throw new Error('Invalid GitHub URL')
    }

    // デフォルトブランチ取得
    if (!info.branch) {
      info.branch = await getDefaultBranch(info.owner, info.repo)
    }

    // Case 1: Single file (blob URL)
    if (info.isBlob && info.path) {
      const rawUrl = toGitHubRawUrl(info, info.path)
      return fetchRawMarkdown(rawUrl)
    }

    // Case 2: Repository or directory
    // README.mdを取得（/readme APIで拡張子揺れ対応）
    try {
      const readmeApiUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/readme${info.branch ? `?ref=${info.branch}` : ''}`
      const response = await fetch(readmeApiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': defaults.userAgent,
        },
      })

      if (response.ok) {
        const readme = (await response.json()) as { download_url: string }
        const rawUrl = readme.download_url
        return fetchRawMarkdown(rawUrl)
      }
    } catch (error) {
      console.warn('README not found, returning placeholder')
    }

    // READMEが見つからない場合は空のプレースホルダー
    return `# ${info.owner}/${info.repo}\n\nNo README found in this repository.`
  },
}

/**
 * List all markdown files in a GitHub repository
 * This is used by the crawl engine to discover files
 */
export async function listGitHubMarkdownFiles(
  url: URL
): Promise<{ path: string; rawUrl: string }[]> {
  const info = parseGitHubUrl(url)

  if (!info) {
    throw new Error('Invalid GitHub URL')
  }

  // デフォルトブランチ取得
  if (!info.branch) {
    info.branch = await getDefaultBranch(info.owner, info.repo)
  }

  // Fetch repository tree
  const tree = await fetchRepoTree(info.owner, info.repo, info.branch)

  // Filter markdown files
  const mdFiles = filterMarkdownFiles(tree, info.path)

  // Convert to raw URLs
  return mdFiles.map((item) => ({
    path: item.path,
    rawUrl: toGitHubRawUrl(info, item.path),
  }))
}
