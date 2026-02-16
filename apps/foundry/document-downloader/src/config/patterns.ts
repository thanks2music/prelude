/**
 * Common documentation URL path patterns
 * Used to detect documentation base paths in URLs
 */
export const docPatterns = [
  'docs',
  'documentation',
  'guide',
  'guides',
  'api',
  'reference',
] as const

export type DocPattern = (typeof docPatterns)[number]
