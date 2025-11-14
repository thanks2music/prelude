# Stripe-Bun Frontend Architecture

## Overview

This document describes the frontend architecture for the stripe-bun project, which implements a React 19 + Stripe Elements payment integration with a separated backend/frontend structure.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React 19 App (http://localhost:3001)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  App.tsx                                        │  │  │
│  │  │  - loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY)   │  │  │
│  │  │  - Elements Provider                           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  CheckoutForm.tsx                               │  │  │
│  │  │  - CardElement (Stripe iframe)                  │  │  │
│  │  │  - confirmCardPayment()                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (CORS enabled)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Backend API (http://localhost:3000)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  POST /create-payment-intent                          │  │
│  │  - Validate amount & currency                         │  │
│  │  - Create PaymentIntent via Stripe SDK                │  │
│  │  - Return clientSecret                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Environment: STRIPE_SECRET_KEY (server-only)                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Stripe API                                │
└──────────────────────────────────────────────────────────────┘
```

## Project Structure

```
stripe-bun/
├── backend/                   # API Server (port 3000)
│   ├── src/
│   │   ├── server.ts         # Bun.serve with CORS
│   │   └── stripeClient.ts   # Stripe SDK initialization
│   ├── .env                  # STRIPE_SECRET_KEY
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # Dev Server (port 3001)
│   ├── src/
│   │   ├── App.tsx           # Main component with Elements
│   │   ├── CheckoutForm.tsx  # Payment form (CardElement)
│   │   ├── main.tsx          # React entry point
│   │   ├── server.ts         # Bun.serve + Bun.build()
│   │   └── styles.css
│   ├── .env                  # PUBLIC_STRIPE_PUBLISHABLE_KEY
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Environment Variable Management

### The PUBLIC_ Prefix Pattern

This project uses a **PUBLIC_ prefix pattern** to safely manage environment variables:

- **Server-only variables** (backend/.env):
  - `STRIPE_SECRET_KEY` - Never exposed to client
  - `STRIPE_WEBHOOK_SECRET` - Never exposed to client

- **Client-safe variables** (frontend/.env):
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY` - Safe to expose to client
  - Only variables with `PUBLIC_` prefix are injected into client bundle

### How It Works

The `PUBLIC_` prefix pattern is implemented using Bun's build system:

1. **Build Time Injection** (frontend/src/server.ts):
   ```typescript
   const buildResult = await Bun.build({
     entrypoints: ['./src/main.tsx'],
     outdir: './dist',
     target: 'browser',
     define: {
       'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
         process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
       ),
     },
   })
   ```

2. **Client Usage** (frontend/src/App.tsx):
   ```typescript
   // At build time, this becomes: const publishableKey = "pk_test_..."
   const publishableKey = process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
   const stripePromise = loadStripe(publishableKey)
   ```

### Security Benefits

1. **Explicit Intent**: The `PUBLIC_` prefix makes it clear which variables are safe for client exposure
2. **Build-time Replacement**: Variables are replaced with string literals at build time, not runtime
3. **No Leakage**: Secret keys without the `PUBLIC_` prefix are never included in the client bundle
4. **Type Safety**: TypeScript can validate the existence of required variables at build time

## Frontend Development Server

The frontend uses a custom Bun development server that:

1. **Builds on Startup**: Runs `Bun.build()` to transpile and bundle React code
2. **Injects Environment Variables**: Uses the `define` option to inject `PUBLIC_*` variables
3. **Serves Static Assets**: Handles HTML, JS, and CSS file serving
4. **Generates Dynamic HTML**: Creates HTML with hashed JS filenames

### Key Implementation (frontend/src/server.ts)

```typescript
// 1. Validate environment variables
if (!process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// 2. Build React app with env var injection
const buildResult = await Bun.build({
  entrypoints: ['./src/main.tsx'],
  outdir: './dist',
  target: 'browser',
  naming: '[dir]/[name].[hash].[ext]',
  define: {
    'process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
  },
})

// 3. Extract built JS filename
const jsFileName = buildResult.outputs.find(o => o.path.endsWith('.js')).path.split('/').pop()

// 4. Generate HTML with built JS reference
const htmlContent = `<!DOCTYPE html>
<html lang="ja">
  <head>...</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/dist/${jsFileName}"></script>
  </body>
</html>`

// 5. Serve with Bun.serve
Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/') return new Response(htmlContent, ...)
    if (url.pathname.startsWith('/dist/')) return new Response(Bun.file(`.${url.pathname}`))
    ...
  }
})
```

## CORS Configuration

The backend enables CORS to allow frontend communication:

```typescript
// backend/src/server.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle preflight requests
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders })
}
```

## Payment Flow

1. **User enters payment amount** → Frontend displays CardElement
2. **User enters card details** → Stored securely in Stripe iframe (PCI compliant)
3. **User clicks "Pay"** → Frontend calls backend `/create-payment-intent`
4. **Backend creates PaymentIntent** → Returns `clientSecret`
5. **Frontend confirms payment** → `stripe.confirmCardPayment(clientSecret, cardElement)`
6. **Stripe processes payment** → Returns success/error to frontend
7. **Frontend displays result** → Success message or error

## Technology Stack

- **Runtime**: Bun v1.3.2
- **Frontend**: React 19, @stripe/react-stripe-js v3.10.0, @stripe/stripe-js v5.10.0
- **Backend**: Bun.serve, Stripe SDK v19+
- **Build System**: Bun.build() with `define` option for env var injection
- **TypeScript**: Strict mode with ESNext target

## Design Decisions

### Why Separate Backend/Frontend?

1. **Security**: Keep secret keys isolated to backend
2. **Scalability**: Can deploy backend and frontend independently
3. **Development**: Easier to work on frontend/backend separately
4. **Production Ready**: Matches typical production deployment patterns

### Why Bun.build() Instead of Vite?

1. **Consistency**: Uses same runtime for dev server and build process
2. **Simplicity**: No additional tools needed
3. **Performance**: Bun's bundler is fast
4. **Native Integration**: Built-in TypeScript and JSX support

### Why CardElement Instead of Payment Element?

1. **Minimum Viable Product**: Start simple with card payments only
2. **Learning Curve**: Easier to understand basic Stripe integration
3. **Future Expansion**: Can upgrade to Payment Element later for multiple payment methods

## Next Steps

1. **Database Integration**: Add SQLite for order management
2. **Webhook Implementation**: Handle payment status updates
3. **Payment Element Migration**: Support multiple payment methods
4. **Product Selection UI**: Add cart and product selection features
5. **Testing**: Add unit and integration tests
6. **Deployment**: Deploy to Render or Railway

## References

- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Bun.build() API](https://bun.sh/docs/bundler)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

---

**Last Updated**: 2025-01-15
