import type { Client } from '@line/bot-sdk'

export default async function handleMessage(event: any, client: Client) {
  if (event.type !== 'message' || event.message?.type !== 'text') return

  const text: string = String(event.message.text || '').trim()
  if (!text) return

  const reply = { type: 'text', text: `「${text}」を受け取りました。` }
  await client.replyMessage(event.replyToken, reply)
}
