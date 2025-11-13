// src/server.ts
import { stripe } from './stripeClient'

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/health') {
      return new Response('ok', { status: 200 })
    }

    if (req.method === 'POST' && url.pathname === '/create-payment-intent') {
      try {
        const body = await req.json().catch(() => ({}))
        const amount = Number(body.amount ?? 1000) // 例: 10.00 USD = 1000 (最小単位)
        const currency = String(body.currency ?? 'usd')

        if (!Number.isFinite(amount) || amount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid amount' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency,
          automatic_payment_methods: { enabled: true },
        })

        return new Response(
          JSON.stringify({ clientSecret: paymentIntent.client_secret }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error(error)
        return new Response(
          JSON.stringify({ error: 'Internal Server Error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Stripe+Bun server running at http://localhost:${server.port}`)
