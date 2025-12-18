import { mkdir, writeFile } from 'fs/promises'
import { dirname } from 'path'

export async function saveFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf-8')
}
