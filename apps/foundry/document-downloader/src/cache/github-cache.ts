/**
 * GitHub API response caching
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
}

/**
 * Simple in-memory cache for GitHub API responses
 */
export class GitHubCache {
  private cache = new Map<string, CacheEntry<any>>()
  private ttl: number

  constructor(ttlMs: number = 3600000) {
    // Default 1 hour
    this.ttl = ttlMs
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    })
  }

  /**
   * Retrieve data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Get ETag for conditional requests
   */
  getEtag(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.etag || null
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear specific entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.ttl,
    }
  }
}

/**
 * Singleton instance for global caching
 */
export const githubCache = new GitHubCache()
