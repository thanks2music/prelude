import express from 'express'
import { Client, middleware, MiddlewareConfig } from '@line/bot-sdk'
import dotenv from 'dotenv'
import handleMessage from './handlers/messageHandler.js'

dotenv.config()

const config: MiddlewareConfig & { channelAccessToken: string } = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
}

const client = new Client(config)
const app = express()

// LINE 署名検証付きミドルウェア
app.post('/webhook', middleware(config), async (req, res) => {
  const events = (req as any).body.events as any[]
  await Promise.all(events.map((ev) => handleMessage(ev, client)))
  res.status(200).end()
})

app.get('/', (_req, res) => {
  res.send('LINE Bot (TypeScript/ESM) is running')
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
