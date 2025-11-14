// src/stripeClient.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // 通常は Stripe SDK のデフォルト API バージョンで問題ない。
  // 明示したい場合のみ apiVersion を指定出来る。
  // Stripe API Version [2025-10-29.clover]
})

export { stripe }
