import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'

/**
 * Validate that a path is within the base directory
 * @throws Error if path would escape the base directory
 */
function validatePath(filePath: string, baseDir: string): void {
  const resolvedBase = resolve(baseDir)
  const resolvedPath = resolve(filePath)
  const relativePath = relative(resolvedBase, resolvedPath)

  // Check if path escapes base directory
  if (relativePath.startsWith('..') || resolve(resolvedBase, relativePath) !== resolvedPath) {
    throw new Error(`Path traversal detected: ${filePath}`)
  }
}

/**
 * Save file to disk with path traversal protection
 * @throws Error if path would escape the output directory
 */
export async function saveFile(path: string, content: string): Promise<void> {
  // Extract base directory and validate path
  const dir = dirname(path)
  const baseDir = path.split('/')[0] || '.'
  validatePath(path, baseDir)

  await mkdir(dir, { recursive: true })
  await writeFile(path, content, 'utf-8')
}
