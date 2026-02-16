/**
 * Duplicate file detection
 */

/**
 * Detects duplicate files by path (case-insensitive)
 */
export class DuplicateDetector {
  private seen = new Set<string>()

  /**
   * Check if path has been seen before (case-insensitive)
   */
  isDuplicate(path: string): boolean {
    const normalized = path.toLowerCase()
    if (this.seen.has(normalized)) {
      return true
    }
    this.seen.add(normalized)
    return false
  }

  /**
   * Mark path as seen without checking
   */
  markAsSeen(path: string): void {
    const normalized = path.toLowerCase()
    this.seen.add(normalized)
  }

  /**
   * Check if path has been seen
   */
  hasSeen(path: string): boolean {
    const normalized = path.toLowerCase()
    return this.seen.has(normalized)
  }

  /**
   * Get count of seen paths
   */
  getCount(): number {
    return this.seen.size
  }

  /**
   * Clear all seen paths
   */
  clear(): void {
    this.seen.clear()
  }
}
