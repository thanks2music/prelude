/**
 * Validate and normalize URL
 * @throws Error if URL is invalid or uses unsupported scheme
 */
export function validateUrl(input: string): URL {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error(`Invalid URL: ${input}`)
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL scheme: ${url.protocol} (only http/https allowed)`)
  }

  return url
}

/**
 * Validate depth value
 * @throws Error if depth is not a valid non-negative integer
 */
export function validateDepth(value: unknown): number {
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`Invalid depth: ${value} (must be non-negative integer)`)
  }
  return num
}

/**
 * Validate concurrency value
 * @throws Error if concurrency is not a valid positive integer
 */
export function validateConcurrency(value: unknown): number {
  const num = Number(value)
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`Invalid concurrency: ${value} (must be positive integer)`)
  }
  return num
}
