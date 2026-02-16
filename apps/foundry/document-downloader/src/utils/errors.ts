/**
 * Error handling utilities for GitHub operations
 */

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp in seconds
}

/**
 * Parse rate limit information from GitHub API response headers
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('X-RateLimit-Limit')
  const remaining = headers.get('X-RateLimit-Remaining')
  const reset = headers.get('X-RateLimit-Reset')

  if (!limit || !remaining || !reset) return null

  return {
    limit: parseInt(limit),
    remaining: parseInt(remaining),
    reset: parseInt(reset),
  }
}

/**
 * Custom error class for GitHub API errors
 */
export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly rateLimitInfo?: RateLimitInfo
  ) {
    super(message)
    this.name = 'GitHubError'
    Object.setPrototypeOf(this, GitHubError.prototype)
  }

  /**
   * Check if this is a permanent error (not worth retrying)
   */
  isPermanent(): boolean {
    return this.statusCode === 404 || this.statusCode === 403
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimit(): boolean {
    return this.statusCode === 429
  }

  /**
   * Check if this is a temporary error (worth retrying)
   */
  isTemporary(): boolean {
    if (!this.statusCode) return true // Network errors are temporary

    return (
      this.statusCode === 408 ||
      this.statusCode === 429 ||
      this.statusCode >= 500
    )
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    if (this.isRateLimit()) {
      const resetTime = this.rateLimitInfo?.reset
        ? new Date(this.rateLimitInfo.reset * 1000).toLocaleTimeString()
        : 'unknown'

      return `GitHub API rate limit exceeded. Resets at ${resetTime}. Consider setting GITHUB_TOKEN environment variable.`
    }

    if (this.statusCode === 404) {
      return `GitHub resource not found (404). Please check the URL.`
    }

    if (this.statusCode === 403) {
      return `GitHub API access forbidden (403). You may need authentication or have insufficient permissions.`
    }

    return this.message
  }
}
