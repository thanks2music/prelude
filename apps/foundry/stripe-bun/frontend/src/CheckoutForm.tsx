import { useState, FormEvent } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
}

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState<number>(1000) // デフォルト: 1000円 (10.00 USD)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setMessage('Stripe がまだ読み込まれていません')
      setMessageType('error')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setMessage('カード情報が見つかりません')
      setMessageType('error')
      return
    }

    setIsProcessing(true)
    setMessage('処理中...')
    setMessageType('info')

    try {
      // バックエンドから clientSecret を取得
      const response = await fetch('http://localhost:3000/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
        }),
      })

      if (!response.ok) {
        throw new Error('決済の準備に失敗しました')
      }

      const { clientSecret } = await response.json()

      // Stripe で決済を確定
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        setMessage(`エラー: ${error.message}`)
        setMessageType('error')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage(`決済が成功しました！ PaymentIntent ID: ${paymentIntent.id}`)
        setMessageType('success')
        // フォームをリセット
        cardElement.clear()
      }
    } catch (error) {
      setMessage(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="amount">
          金額（最小単位）
          <span style={{ fontSize: '12px', color: '#8898aa', marginLeft: '8px' }}>
            例: 1000 = $10.00
          </span>
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="50"
          step="1"
          disabled={isProcessing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="card-element">カード情報</label>
        <div className="card-element-container">
          <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p style={{ fontSize: '12px', color: '#8898aa', marginTop: '8px' }}>
          テストカード: 4242 4242 4242 4242 | 有効期限: 任意の未来日 | CVC: 任意の3桁
        </p>
      </div>

      <button type="submit" disabled={!stripe || isProcessing}>
        {isProcessing ? '処理中...' : `$${(amount / 100).toFixed(2)} を支払う`}
      </button>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </form>
  )
}

export default CheckoutForm
