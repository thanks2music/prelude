/**
 * Retry utilities for handling transient failures
 */

import { GitHubError, parseRateLimitHeaders } from './errors.js'
import { logger } from './logger.js'

export interface RetryOptions {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatuses: number[]
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: Partial<RetryOptions> = {}
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init)

      // Success or non-retryable error
      if (response.ok || !opts.retryableStatuses.includes(response.status)) {
        return response
      }

      // Special handling for rate limit errors (429)
      if (response.status === 429) {
        const resetHeader = response.headers.get('X-RateLimit-Reset')
        if (resetHeader) {
          const resetTime = parseInt(resetHeader) * 1000
          const waitTime = Math.max(0, resetTime - Date.now())
          logger.warn(
            `Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`
          )
          await sleep(waitTime + 1000) // Add 1s buffer
          continue
        }
      }

      const rateLimitInfo = parseRateLimitHeaders(response.headers)
      lastError = new GitHubError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        rateLimitInfo || undefined
      )

      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelayMs
        )
        logger.warn(
          `Request failed (attempt ${attempt + 1}/${opts.maxRetries + 1}). Retrying in ${delay}ms...`
        )
        await sleep(delay)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelayMs
        )
        logger.warn(
          `Network error (attempt ${attempt + 1}/${opts.maxRetries + 1}). Retrying in ${delay}ms...`
        )
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries')
}
