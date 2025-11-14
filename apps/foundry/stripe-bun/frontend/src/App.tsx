import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from './CheckoutForm'

// Bun.build() の define で注入された環境変数を取得
// process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY はビルド時に文字列リテラルに置換される
const publishableKey = process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'PUBLIC_STRIPE_PUBLISHABLE_KEY is not available. Please check your .env file.'
  )
}

const stripePromise = loadStripe(publishableKey)

function App() {
  return (
    <div className="container">
      <h1>Stripe 決済デモ</h1>
      <p className="subtitle">カード情報を入力して決済をテストできます</p>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  )
}

export default App
