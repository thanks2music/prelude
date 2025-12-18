#!/usr/bin/env node
import { crawl } from './crawl.js'

const [, , entryUrl, ...rest] = process.argv

if (!entryUrl) {
  console.error('Usage: preludex <docs-url> --out <dir>')
  process.exit(1)
}

const outIndex = rest.indexOf('--out')
const outDir = outIndex >= 0 ? rest[outIndex + 1] : 'docs'

await crawl(entryUrl, outDir)
