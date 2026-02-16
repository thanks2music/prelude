/**
 * GitHub API rate limit monitoring and management
 */

import {
  parseRateLimitHeaders,
  type RateLimitInfo,
} from '../utils/errors.js'
import { logger } from '../utils/logger.js'

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Manages GitHub API rate limit state
 */
export class RateLimitManager {
  private limit: number = 60 // Unauthenticated default
  private remaining: number = 60
  private reset: number = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  private hasShownWarning: boolean = false

  /**
   * Update rate limit state from API response headers
   */
  update(headers: Headers): void {
    const info = parseRateLimitHeaders(headers)
    if (info) {
      this.limit = info.limit
      this.remaining = info.remaining
      this.reset = info.reset

      // Reset warning flag if limit has been refreshed
      if (this.remaining > this.limit * 0.1) {
        this.hasShownWarning = false
      }
    }
  }

  /**
   * Check if we should wait before making more requests
   */
  shouldWait(): boolean {
    return this.remaining < this.limit * 0.1 && this.remaining > 0
  }

  /**
   * Check if rate limit is exhausted
   */
  isExhausted(): boolean {
    return this.remaining === 0
  }

  /**
   * Wait if needed based on rate limit status
   */
  async waitIfNeeded(): Promise<void> {
    if (this.isExhausted()) {
      const resetTime = this.reset * 1000
      const waitTime = Math.max(0, resetTime - Date.now())
      logger.warn(
        `⚠️  Rate limit exhausted. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`
      )
      await sleep(waitTime + 1000) // Add 1s buffer
      // Reset remaining count after waiting
      this.remaining = this.limit
    } else if (this.shouldWait() && !this.hasShownWarning) {
      logger.warn(
        `⚠️  Rate limit low: ${this.remaining}/${this.limit} requests remaining.`
      )

      // Show GITHUB_TOKEN recommendation for unauthenticated users
      if (this.limit === 60) {
        logger.warn(
          `   💡 Tip: Set GITHUB_TOKEN environment variable to increase limit to 5000/hour.`
        )
        logger.warn(`   Example: export GITHUB_TOKEN=ghp_your_token_here`)
      }

      this.hasShownWarning = true
    }
  }

  /**
   * Get current rate limit status as string
   */
  getStatus(): string {
    const resetDate = new Date(this.reset * 1000)
    const resetTime = resetDate.toLocaleTimeString()
    return `Rate limit: ${this.remaining}/${this.limit} (resets at ${resetTime})`
  }

  /**
   * Get remaining requests count
   */
  getRemaining(): number {
    return this.remaining
  }

  /**
   * Get total limit
   */
  getLimit(): number {
    return this.limit
  }
}

/**
 * Singleton instance for global rate limit tracking
 */
export const rateLimitManager = new RateLimitManager()
