import { resolve, normalize, relative, isAbsolute } from 'node:path'

/**
 * ファイルパスの安全性チェック
 * パストラバーサル攻撃を防ぐため、指定されたベースディレクトリ外へのアクセスを拒否する
 *
 * @param filePath - 検証するファイルパス
 * @param baseDir - ベースディレクトリ（この配下のみ許可）
 * @returns 検証済みの絶対パス
 * @throws パストラバーサルやベースディレクトリ外へのアクセスが検出された場合
 */
export function validateFilePath(filePath: string, baseDir: string): string {
  // 1. 正規化（.や..を解決）
  const normalized = normalize(filePath)

  // 2. 絶対パスの拒否
  if (isAbsolute(normalized)) {
    throw new Error(`Absolute path not allowed: ${filePath}`)
  }

  // 3. 親ディレクトリ参照の検出
  if (normalized.includes('..')) {
    throw new Error(`Path traversal detected: ${filePath}`)
  }

  // 4. 最終パスがbaseDir配下であることを確認
  const fullPath = resolve(baseDir, normalized)
  const relativePath = relative(baseDir, fullPath)

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`Path escapes base directory: ${filePath}`)
  }

  return fullPath
}
