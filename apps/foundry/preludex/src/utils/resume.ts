/**
 * Resume functionality for interrupted downloads
 */

import { join } from 'path'

export interface DownloadState {
  url: string
  totalFiles: number
  downloadedFiles: string[]
  timestamp: number
}

/**
 * Manages download state for resume functionality
 */
export class ResumeManager {
  private stateFile: string

  constructor(outDir: string) {
    this.stateFile = join(outDir, '.preludex-state.json')
  }

  /**
   * Load saved download state
   */
  async loadState(): Promise<DownloadState | null> {
    try {
      const file = Bun.file(this.stateFile)
      const exists = await file.exists()
      if (!exists) return null

      const content = await file.text()
      return JSON.parse(content) as DownloadState
    } catch (error) {
      return null
    }
  }

  /**
   * Save current download state
   */
  async saveState(state: DownloadState): Promise<void> {
    try {
      await Bun.write(this.stateFile, JSON.stringify(state, null, 2))
    } catch (error) {
      // Silently fail - resume is optional
    }
  }

  /**
   * Clear saved state (called on successful completion)
   */
  async clearState(): Promise<void> {
    try {
      const file = Bun.file(this.stateFile)
      const exists = await file.exists()
      if (exists) {
        await Bun.write(this.stateFile, '')
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Filter out already-downloaded files
   */
  filterPendingFiles<T extends { path: string }>(
    allFiles: T[],
    downloaded: string[]
  ): T[] {
    const downloadedSet = new Set(downloaded)
    return allFiles.filter((file) => !downloadedSet.has(file.path))
  }

  /**
   * Create download state object
   */
  createState(url: string, totalFiles: number, downloadedFiles: string[]): DownloadState {
    return {
      url,
      totalFiles,
      downloadedFiles,
      timestamp: Date.now(),
    }
  }
}
